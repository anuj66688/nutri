'use client';

import React, { useState, useEffect } from 'react';
import { Navigation, NavTab } from '@/components/Navigation';
import { DashboardView } from '@/components/DashboardView';
import { FoodLogView } from '@/components/FoodLogView';
import { LabReportsView } from '@/components/LabReportsView';
import { LabHistoryView } from '@/components/LabHistoryView';
import { PersonalHistoryView } from '@/components/PersonalHistoryView';
import { AICopilot } from '@/components/AICopilot';
import { FoodLogModal } from '@/components/FoodLogModal';
import { FoodDetailModal } from '@/components/FoodDetailModal';
import { LabUploadModal } from '@/components/LabUploadModal';
import { DietEffectivenessModal } from '@/components/DietEffectivenessModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { ProfileModal } from '@/components/ProfileModal';
import { api } from '@/lib/api';
import { DashboardData, FoodLog, Profile } from '@/types';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Modals state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodModalMealType, setFoodModalMealType] = useState<any>('lunch');
  const [selectedFoodForDetail, setSelectedFoodForDetail] = useState<FoodLog | null>(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showDietModal, setShowDietModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const fetchAppData = async () => {
    setIsLoading(true);
    setBackendError(null);
    try {
      // Check profile
      try {
        const prof = await api.getProfile();
        setProfile(prof);
        setShowOnboarding(false);
      } catch (err: any) {
        if (err.message?.includes('404') || err.message?.includes('onboarding') || err.message?.includes('not found')) {
          setShowOnboarding(true);
        } else {
          throw err;
        }
      }

      // Fetch dashboard
      const dash = await api.getDashboard();
      setDashboardData(dash);
    } catch (err: any) {
      console.warn("API load note:", err);
      setBackendError(err.message || 'Unable to connect to the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const handleOpenFoodModal = (mealType: string = 'lunch') => {
    setFoodModalMealType(mealType);
    setShowFoodModal(true);
  };

  const handleOnboardingComplete = (newProfile: Profile) => {
    setProfile(newProfile);
    setShowOnboarding(false);
    fetchAppData();
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navigation
        currentTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenDietModal={() => setShowDietModal(true)}
        userName={profile?.name || 'User'}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-10">
        {/* Backend Error State */}
        {backendError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{backendError}</span>
            </div>
            <button
              onClick={fetchAppData}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Global Loading Screen */}
        {isLoading && !dashboardData ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs text-slate-500 font-medium">
              Connecting to Clinical Nutrition Engine...
            </p>
          </div>
        ) : (
          <>
            {/* View Switching */}
            {activeTab === 'dashboard' && dashboardData && (
              <DashboardView
                data={dashboardData}
                onOpenFoodModal={handleOpenFoodModal}
                onOpenLabModal={() => setShowLabModal(true)}
                onSelectFood={(food) => setSelectedFoodForDetail(food)}
                onOpenDietModal={() => setShowDietModal(true)}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'food' && (
              <FoodLogView
                onOpenFoodModal={() => handleOpenFoodModal('lunch')}
                onSelectFood={(food) => setSelectedFoodForDetail(food)}
              />
            )}

            {activeTab === 'labs' && (
              <LabReportsView
                onOpenUploadModal={() => setShowLabModal(true)}
              />
            )}

            {activeTab === 'lab-history' && (
              <LabHistoryView
                onOpenUploadModal={() => setShowLabModal(true)}
              />
            )}

            {activeTab === 'history' && (
              <PersonalHistoryView />
            )}

            {activeTab === 'copilot' && (
              <AICopilot dashboardData={dashboardData} />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <FoodLogModal
        isOpen={showFoodModal}
        onClose={() => setShowFoodModal(false)}
        onFoodLogged={fetchAppData}
        defaultMealType={foodModalMealType}
      />

      <FoodDetailModal
        food={selectedFoodForDetail}
        isOpen={Boolean(selectedFoodForDetail)}
        onClose={() => setSelectedFoodForDetail(null)}
      />

      <LabUploadModal
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        onReportUploaded={fetchAppData}
      />

      <DietEffectivenessModal
        isOpen={showDietModal}
        onClose={() => setShowDietModal(false)}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profile}
        onProfileUpdated={fetchAppData}
      />
    </div>
  );
}
