import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProfileCompletionBanner() {
  const { isProfileComplete, profile } = useAuth();
  
  // Only show for experts with incomplete profiles
  const expertRoles = ['therapist', 'relationship_expert', 'financial_expert', 'dating_coach', 'health_wellness_coach'];
  const isExpert = profile && expertRoles.includes(profile.user_role);
  
  if (isProfileComplete || !isExpert) {
    return null;
  }
  
  return (
    <Card className="mb-6 border-amber-500/50 bg-amber-500/10 shadow-amber-500/5">
      <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-amber-500" />
          <div>
            <h3 className="font-medium text-foreground">Your expert profile is incomplete</h3>
            <p className="text-sm text-muted-foreground">
              Complete your profile to be visible to patients and increase your chances of being contacted.
            </p>
          </div>
        </div>
        <Link to="/therapist/profile">
          <Button className="whitespace-nowrap">
            Complete Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
} 