import { create } from "zustand";
import { supabase } from "@/services/supabase";
import type { User } from "@/types";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    profile: any | null; // explicitly add profile for consumers
    session: Session | null;
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (
        email: string,
        password: string,
        fullName: string
    ) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    session: null,
    isLoading: false,
    isInitialized: false,

    initialize: async () => {
        // Fetch existing session
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            set({ session, user: profile, profile, isInitialized: true });
        } else {
            set({ session: null, user: null, profile: null, isInitialized: true });
        }

        // Listen for auth state changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const profile = await fetchProfile(session.user.id);
                set({ session, user: profile, profile });
            } else {
                set({ session: null, user: null, profile: null });
            }
        });
    },

    signIn: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        set({ isLoading: false });

        if (error) return { error: error.message };

        if (data.session?.user) {
            const profile = await fetchProfile(data.session.user.id);
            set({ session: data.session, user: profile, profile });
        }

        return {};
    },

    signUp: async (email, password, fullName) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });
        set({ isLoading: false });

        if (error) return { error: error.message };

        // Session may be null if email confirmation is required
        if (data.session?.user) {
            const profile = await fetchProfile(data.session.user.id);
            set({ session: data.session, user: profile, profile });
        }

        return {};
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, session: null });
    },

    setSession: (session) => set({ session }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        role: data.role ?? "user",
        created_at: data.created_at,
    };
}