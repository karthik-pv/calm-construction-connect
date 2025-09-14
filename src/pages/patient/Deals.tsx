import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ScratchCard from "@/components/ui/ScratchCard";
import { supabase } from "@/lib/supabaseClient";
import { Gift, MapPin, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  description: string | null;
  working_hours: string;
  discount_coupons: any | null;
}

export default function Deals() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("restaurants")
          .select("id,name,address,description,working_hours,discount_coupons")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setRestaurants((data || []) as Restaurant[]);
      } catch (e: any) {
        setError(e?.message || "Failed to load deals.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selected = restaurants.find((r) => r.id === openId) || null;

  return (
    <DashboardLayout>
      <div className="p-6">
        <PageTitle title="Deals & Offers" subtitle="Discover places with exclusive savings" />

        {loading && (
          <div className="mt-6 glass-card rounded-xl p-6">
            <p className="text-amber-50/80">Loading deals...</p>
          </div>
        )}
        {error && (
          <div className="mt-6 glass-card rounded-xl p-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => {
              const list = Array.isArray(r.discount_coupons)
                ? r.discount_coupons
                : r.discount_coupons
                ? [r.discount_coupons]
                : [];

              const hasCoupons = list.length > 0;

              return (
                <Card key={r.id} className="glass-card overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-amber-200" />
                      <span className="gradient-text">{r.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {r.description && (
                      <p className="text-amber-50/80 text-sm">{r.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-amber-50/80 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{r.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-50/80 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{r.working_hours}</span>
                    </div>

                    {hasCoupons ? (
                      <div className="space-y-3">
                        {list.map((c: any, idx: number) => (
                          <div key={idx} className="flex flex-col items-center">
                            <ScratchCard width={320} height={120} brushSize={26} threshold={60} className="mx-auto">
                              <div className="w-full h-full flex flex-col items-center justify-center">
                                <p className="text-sm text-amber-100/80">Scratch to reveal your coupon</p>
                                <p className="text-2xl font-semibold gradient-heading mt-1 tracking-wide">
                                  {c.code || c.coupon || c.id || 'AC-LOVE-20'}
                                </p>
                                {(c.percent || c.percentage) && (
                                  <p className="text-amber-50/80 text-sm mt-1">Save {(c.percent || c.percentage)}%</p>
                                )}
                                {c.description && (
                                  <p className="text-amber-50/60 text-xs mt-1">{c.description}</p>
                                )}
                                {c.expires_at && (
                                  <p className="text-amber-50/60 text-xs mt-1">Valid: {c.expires_at}</p>
                                )}
                              </div>
                            </ScratchCard>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl p-4 glass">
                        <p className="text-amber-50/80 text-sm">No active coupons right now. Check back soon!</p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={() => setOpenId(r.id)} variant="outline" className="text-amber-100 border-amber-200/30 hover:bg-amber-900/20">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="glass-card max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="gradient-text">{selected.name}</DialogTitle>
                <DialogDescription className="text-amber-50/80">
                  {selected.description || "Restaurant details and offers"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-2 text-amber-50/80 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{selected.address}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-50/80 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{selected.working_hours}</span>
                </div>

                <div className="mt-4">
                  <p className="text-amber-100/90 font-medium mb-2">Available Coupons</p>
                  {(() => {
                    const list = Array.isArray(selected.discount_coupons)
                      ? selected.discount_coupons
                      : selected.discount_coupons
                      ? [selected.discount_coupons]
                      : [];
                    if (list.length === 0) {
                      return (
                        <div className="rounded-xl p-4 glass">
                          <p className="text-amber-50/80 text-sm">No active coupons right now.</p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        {list.map((c: any, idx: number) => (
                          <ScratchCard key={idx} width={360} height={130} brushSize={28} threshold={60}>
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <p className="text-sm text-amber-100/80">Scratch to reveal your coupon</p>
                              <p className="text-2xl font-semibold gradient-heading mt-1 tracking-wide">
                                {c.code || c.coupon || c.id || 'AC-LOVE-20'}
                              </p>
                              {(c.percent || c.percentage) && (
                                <p className="text-amber-50/80 text-sm mt-1">Save {(c.percent || c.percentage)}%</p>
                              )}
                              {c.description && (
                                <p className="text-amber-50/60 text-xs mt-1">{c.description}</p>
                              )}
                              {c.expires_at && (
                                <p className="text-amber-50/60 text-xs mt-1">Valid: {c.expires_at}</p>
                              )}
                            </div>
                          </ScratchCard>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
