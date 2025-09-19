import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGeminiChat } from "./useGeminiChat";

export interface ChatbotMessage {
  id: string;
  user_id: string;
  user_message: string;
  bot_response: string;
  created_at: string;
}

// Function to fetch chatbot messages
export async function fetchChatbotMessages(userId: string | undefined) {
  if (!userId) throw new Error("User not authenticated");
  
  const { data, error } = await supabase
    .from("chatbot_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
    
  if (error) {
    console.error("Error fetching chatbot messages:", error);
    throw error;
  }
  
  return data as ChatbotMessage[];
}

// Function to send a message to the chatbot
export async function sendChatbotMessage(
  userId: string, 
  message: string, 
  botResponse: string
) {
  const { data, error } = await supabase
    .from("chatbot_messages")
    .insert([
      {
        user_id: userId,
        user_message: message,
        bot_response: botResponse,
      },
    ])
    .select();
    
  if (error) {
    console.error("Error sending chatbot message:", error);
    toast.error("Failed to send message. Please try again.");
    throw error;
  }
  
  return data[0] as ChatbotMessage;
}

// ---------- Restaurant & Coupon Helpers ----------

type Restaurant = {
  id: string;
  name: string;
  address: string;
  description: string | null;
  working_hours: string;
  discount_coupons: any | null; // Expecting array of { code, description?, percent?, expires_at? }
};

// Persist last suggestions for contextual coupon requests
const SUGGESTIONS_STORAGE_KEY = 'ac_last_restaurant_suggestions';

function getBestStorage(): Storage | null {
  try { if (typeof window !== 'undefined' && window.localStorage) return window.localStorage; } catch {}
  try { if (typeof window !== 'undefined' && window.sessionStorage) return window.sessionStorage; } catch {}
  return null;
}

function saveLastSuggestions(restaurants: Restaurant[]) {
  const store = getBestStorage();
  if (!store) return;
  try {
    // Store minimal fields needed
    const minimal = restaurants.map(r => ({ id: r.id, name: r.name, discount_coupons: r.discount_coupons }));
    store.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(minimal));
  } catch {}
}

function loadLastSuggestions(): Array<{ id: string; name: string; discount_coupons: any | null }> {
  const store = getBestStorage();
  if (!store) return [];
  try {
    const raw = store.getItem(SUGGESTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x.id === 'string' && typeof x.name === 'string');
  } catch {
    return [];
  }
}

const RESTAURANT_INTENT_PATTERNS = [
  /\brestaurants?\b/i,
  /\b(place|places) to eat\b/i,
  /\bgo out (?:for|to) (?:eat|dinner|lunch)\b/i,
  /\btake (?:my|our) (?:gf|girlfriend|bf|boyfriend|partner|wife|husband) (?:to|out)\b/i,
];

const COUPON_INTENT_PATTERNS = [
  /\bcoupon\b/i,
  /\bdiscount\b/i,
  /\bvoucher\b/i,
  /\bpromo\b/i,
  /\bcode\b/i,
];

function hasRestaurantIntent(message: string): boolean {
  return RESTAURANT_INTENT_PATTERNS.some((re) => re.test(message));
}

function hasCouponIntent(message: string): boolean {
  return COUPON_INTENT_PATTERNS.some((re) => re.test(message));
}

async function fetchTopRestaurants(limit = 3): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id,name,address,description,working_hours,discount_coupons')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
  return (data || []) as Restaurant[];
}

async function findRestaurantByNameLike(nameFragment: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id,name,address,description,working_hours,discount_coupons')
    .ilike('name', `%${nameFragment}%`)
    .limit(1)
    .maybeSingle();
  if (error) {
    // maybeSingle returns error when 0 rows; treat that as null
    if ((error as any).code === 'PGRST116') return null;
    console.error('Error finding restaurant by name:', error);
    return null;
  }
  return (data as Restaurant) || null;
}

function formatRestaurantSuggestions(restaurants: Restaurant[]): string {
  if (!restaurants.length) {
    return "I couldn't find restaurant options right now. Try again later or name a place you like.";
  }

  const items = restaurants.map((r, idx) => {
    const desc = r.description ? ` – ${r.description}` : '';
    return `${idx + 1}. ${r.name}${desc}\n   📍 ${r.address}\n   🕒 ${r.working_hours}`;
  });

  return [
    "Got it — here are a few nice spots you might like:",
    '',
    ...items,
    '',
    "Want a deal? Just say: ‘give me a coupon’ and I’ll apply it to a top pick."
  ].join('\n');
}

function pickCoupon(coupons: any): {code: string; description?: string; percent?: number; expires_at?: string} | null {
  if (!coupons) return null;
  // Support either array or single object
  const list = Array.isArray(coupons) ? coupons : [coupons];
  if (list.length === 0) return null;
  // Choose the first valid coupon
  const coupon = list[0] || null;
  if (!coupon) return null;
  return {
    code: coupon.code || coupon.coupon || coupon.id || 'AC-LOVE-20',
    description: coupon.description,
    percent: coupon.percent || coupon.percentage,
    expires_at: coupon.expires_at || coupon.valid_till || coupon.valid_until,
  };
}

function formatCouponReveal(name: string, coupon: {code: string; description?: string; percent?: number; expires_at?: string}): string {
  const parts: string[] = [];
  parts.push(`Awesome choice! Here’s a little something for ${name}:`);
  parts.push('');
  parts.push('┏━━━━━━━━ 🎟️ Coupon Unlocked ━━━━━━━━┓');
  parts.push(`   CODE   : ${coupon.code}`);
  if (coupon.percent) parts.push(`   SAVE   : ${coupon.percent}% off`);
  if (coupon.description) parts.push(`   NOTE   : ${coupon.description}`);
  if (coupon.expires_at) parts.push(`   VALID  : ${coupon.expires_at}`);
  parts.push('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  parts.push('');
  parts.push('Show this code at checkout. Want options in another area? Just ask!');
  return parts.join('\n');
}

function extractRequestedRestaurantName(message: string): string | null {
  // Try to capture patterns like "coupon for X", "discount for X", etc.
  const m = message.match(/(?:coupon|discount|voucher|promo|code)\s+(?:for|at|from)\s+(.+)/i);
  if (m && m[1]) return m[1].trim();
  // Otherwise return null so we can fall back to last suggestions
  return null;
}

// Hook to fetch chatbot messages
export function useChatbotMessages() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ["chatbotMessages", profile?.id],
    queryFn: () => fetchChatbotMessages(profile?.id),
    enabled: !!profile?.id,
  });
}

// Hook to send a message to the chatbot
export function useSendChatbotMessage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { getGeminiResponse } = useGeminiChat();
  
  return useMutation({
    mutationFn: async (message: string) => {
      if (!profile?.id) throw new Error("User not authenticated");

      const lower = message.toLowerCase();

      // Coupon intent: Try to fetch a coupon for a named restaurant
      if (hasCouponIntent(lower)) {
        // Determine which restaurant
        let nameFragment = extractRequestedRestaurantName(message);
        let restaurant: Restaurant | null = null;

        if (nameFragment) {
          restaurant = await findRestaurantByNameLike(nameFragment);
        }

        // If still unknown, try a heuristic: search for any restaurant whose name appears in the message
        if (!restaurant) {
          // Quick pass: fetch a few and match locally
          const candidates = await fetchTopRestaurants(10);
          restaurant = candidates.find(r => lower.includes(r.name.toLowerCase())) || null;
        }

        // If still unknown, fall back to last suggestions stored locally
        if (!restaurant) {
          const recent = loadLastSuggestions();
          // Prefer the first with a coupon; else just take the first
          const preferred = recent.find(r => !!pickCoupon(r.discount_coupons)) || recent[0] || null;
          if (preferred) {
            // We might need full fields, but for coupon reveal we only need name and coupons
            const coupon = pickCoupon(preferred.discount_coupons);
            if (coupon) {
              const reveal = formatCouponReveal(preferred.name, coupon);
              return sendChatbotMessage(profile.id, message, reveal);
            } else {
              const noCouponMsg = `I couldn't find an active coupon for ${preferred.name} right now. Want me to suggest a few places with deals?`;
              return sendChatbotMessage(profile.id, message, noCouponMsg);
            }
          }
        }

        if (!restaurant) {
          const prompt = "Sure — which restaurant did you have in mind? You can also say: ‘give me a coupon’ after I suggest places.";
          return sendChatbotMessage(profile.id, message, prompt);
        }

        const coupon = pickCoupon(restaurant.discount_coupons);
        if (!coupon) {
          const noCouponMsg = `I couldn't find an active coupon for ${restaurant.name} right now. Want me to suggest a few places with deals?`;
          return sendChatbotMessage(profile.id, message, noCouponMsg);
        }

        const reveal = formatCouponReveal(restaurant.name, coupon);
        return sendChatbotMessage(profile.id, message, reveal);
      }

      // Restaurant intent: suggest places
      if (hasRestaurantIntent(lower)) {
        try {
          const restaurants = await fetchTopRestaurants(3);
          // Save to local suggestions for later coupon intent
          saveLastSuggestions(restaurants);
          const response = formatRestaurantSuggestions(restaurants);
          return sendChatbotMessage(profile.id, message, response);
        } catch (e) {
          console.error('Error during restaurant suggestion:', e);
          const fallback = "I couldn't fetch suggestions right now. Try again in a moment or tell me an area you prefer.";
          return sendChatbotMessage(profile.id, message, fallback);
        }
      }
      
      // Default: Use Gemini AI
      const botResponse = await getGeminiResponse(message);
      
      // Save both the user message and AI response
      return sendChatbotMessage(profile.id, message, botResponse);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbotMessages", profile?.id] });
    },
    onError: (error) => {
      console.error("Error in sendChatbotMessage mutation:", error);
      toast.error("Failed to get AI response. Please try again.");
    },
  });
} 