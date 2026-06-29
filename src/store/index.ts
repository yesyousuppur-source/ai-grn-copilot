import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  User,
  Company,
  GRNTemplate,
  ExtractedInvoice,
  GRNRecord,
  ChatMessage,
  Notification,
  ProcessingStatus,
} from '@/types';

// =============================================
// AUTH STORE
// =============================================
interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}));

// =============================================
// COMPANY STORE
// =============================================
interface CompanyState {
  companies: Company[];
  activeCompany: Company | null;
  isLoading: boolean;
  setCompanies: (companies: Company[]) => void;
  setActiveCompany: (company: Company | null) => void;
  addCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  setLoading: (loading: boolean) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      companies: [],
      activeCompany: null,
      isLoading: false,
      setCompanies: (companies) => set({ companies }),
      setActiveCompany: (activeCompany) => set({ activeCompany }),
      addCompany: (company) =>
        set((state) => ({ companies: [...state.companies, company] })),
      updateCompany: (company) =>
        set((state) => ({
          companies: state.companies.map((c) => (c.id === company.id ? company : c)),
          activeCompany:
            state.activeCompany?.id === company.id ? company : state.activeCompany,
        })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'grn-company-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeCompany: state.activeCompany }),
    }
  )
);

// =============================================
// TEMPLATE STORE
// =============================================
interface TemplateState {
  templates: GRNTemplate[];
  activeTemplate: GRNTemplate | null;
  isLoading: boolean;
  setTemplates: (templates: GRNTemplate[]) => void;
  setActiveTemplate: (template: GRNTemplate | null) => void;
  addTemplate: (template: GRNTemplate) => void;
  updateTemplate: (template: GRNTemplate) => void;
  removeTemplate: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  activeTemplate: null,
  isLoading: false,
  setTemplates: (templates) => set({ templates }),
  setActiveTemplate: (activeTemplate) => set({ activeTemplate }),
  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),
  updateTemplate: (template) =>
    set((state) => ({
      templates: state.templates.map((t) => (t.id === template.id ? template : t)),
      activeTemplate:
        state.activeTemplate?.id === template.id ? template : state.activeTemplate,
    })),
  removeTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      activeTemplate: state.activeTemplate?.id === id ? null : state.activeTemplate,
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));

// =============================================
// GRN WORKFLOW STORE
// =============================================
interface GRNWorkflowState {
  currentGRN: Partial<GRNRecord> | null;
  currentInvoice: Partial<ExtractedInvoice> | null;
  processingStatus: ProcessingStatus | null;
  showTrainButton: boolean;
  correctedFields: string[];
  setCurrentGRN: (grn: Partial<GRNRecord> | null) => void;
  setCurrentInvoice: (invoice: Partial<ExtractedInvoice> | null) => void;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  markFieldCorrected: (fieldId: string) => void;
  resetWorkflow: () => void;
}

export const useGRNWorkflowStore = create<GRNWorkflowState>((set) => ({
  currentGRN: null,
  currentInvoice: null,
  processingStatus: null,
  showTrainButton: false,
  correctedFields: [],
  setCurrentGRN: (currentGRN) => set({ currentGRN }),
  setCurrentInvoice: (currentInvoice) => set({ currentInvoice }),
  setProcessingStatus: (processingStatus) => set({ processingStatus }),
  markFieldCorrected: (fieldId) =>
    set((state) => ({
      correctedFields: [...state.correctedFields, fieldId],
      showTrainButton: true,
    })),
  resetWorkflow: () =>
    set({
      currentGRN: null,
      currentInvoice: null,
      processingStatus: null,
      showTrainButton: false,
      correctedFields: [],
    }),
}));

// =============================================
// CHAT STORE
// =============================================
interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  addMessage: (message: ChatMessage) => void;
  setOpen: (open: boolean) => void;
  setTyping: (typing: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isOpen: false,
  isTyping: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setOpen: (isOpen) => set({ isOpen }),
  setTyping: (isTyping) => set({ isTyping }),
  clearMessages: () => set({ messages: [] }),
}));

// =============================================
// NOTIFICATION STORE
// =============================================
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}));

// =============================================
// UI STORE
// =============================================
interface UIState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      commandPaletteOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'grn-ui-store',
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    }
  )
);
