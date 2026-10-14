import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { DemoBanner } from './components/layout/DemoBanner';
import { Header } from './components/layout/Header';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { DonorList } from './components/donors/DonorList';
import { InventoryList } from './components/inventory/InventoryList';
import { RequestList } from './components/requests/RequestList';
import { DemandForecastingView } from './components/forecasting/DemandForecastingView';
import { HospitalDirectory } from './components/hospitals/HospitalDirectory';
import { AuditLogView } from './components/audit/AuditLogView';
import { CreateRequestModal } from './components/requests/CreateRequestModal';
import { AddBatchModal } from './components/inventory/AddBatchModal';
import { DonorModal } from './components/donors/DonorModal';
import { SmartAllocationModal } from './components/requests/SmartAllocationModal';
import { BloodRequest } from './types/request';

const AppContent: React.FC = () => {
  const { requests } = useData();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global modals triggered from header or dashboard quick actions
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(false);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [isAddDonorModalOpen, setIsAddDonorModalOpen] = useState(false);
  const [allocateRequestTarget, setAllocateRequestTarget] = useState<BloodRequest | null>(null);

  const handleOpenAllocateModal = (requestId: string) => {
    const target = requests.find(r => r.id === requestId);
    if (target) {
      setAllocateRequestTarget(target);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      {/* Top Prototype / Synthetic Disclaimer Banner */}
      <DemoBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header */}
          <Header
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onNavigateToRequests={() => setCurrentTab('requests')}
            onNavigateToInventory={() => setCurrentTab('inventory')}
          />

          {/* Body Section */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentTab}
                onOpenCreateRequest={() => setIsCreateRequestModalOpen(true)}
                onOpenAddBatch={() => setIsAddBatchModalOpen(true)}
                onOpenAddDonor={() => setIsAddDonorModalOpen(true)}
                onOpenAllocateModal={handleOpenAllocateModal}
              />
            )}

            {currentTab === 'donors' && <DonorList />}

            {currentTab === 'inventory' && <InventoryList />}

            {currentTab === 'requests' && <RequestList />}

            {currentTab === 'forecasting' && <DemandForecastingView />}

            {currentTab === 'hospitals' && (
              <HospitalDirectory
                onOpenCreateRequest={() => setIsCreateRequestModalOpen(true)}
              />
            )}

            {currentTab === 'audit' && <AuditLogView />}
          </main>
        </div>
      </div>

      {/* Global Quick Modals */}
      <CreateRequestModal
        isOpen={isCreateRequestModalOpen}
        onClose={() => setIsCreateRequestModalOpen(false)}
      />

      <AddBatchModal
        isOpen={isAddBatchModalOpen}
        onClose={() => setIsAddBatchModalOpen(false)}
      />

      <DonorModal
        donorToEdit={null}
        isOpen={isAddDonorModalOpen}
        onClose={() => setIsAddDonorModalOpen(false)}
      />

      <SmartAllocationModal
        request={allocateRequestTarget}
        isOpen={!!allocateRequestTarget}
        onClose={() => setAllocateRequestTarget(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
