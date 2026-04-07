import { create } from "zustand";
import { supabase } from "@/services/supabase";
import type { User } from "@/types";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    profile: any | null;
    session: Session | null;
    isLoading: boolean;
    isInitialized: boolean;
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
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
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            // FIX: Agar profile null hai tab bhi user ko null mat karo, basic data rakho
            const userData = profile || {
                id: session.user.id,
                email: session.user.email || "",
                full_name: session.user.user_metadata?.full_name || "User",
                role: "user"
            };
            set({ session, user: userData as User, profile, isInitialized: true });
        } else {
            set({ session: null, user: null, profile: null, isInitialized: true });
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const profile = await fetchProfile(session.user.id);
                const userData = profile || {
                    id: session.user.id,
                    email: session.user.email || "",
                    full_name: session.user.user_metadata?.full_name || "User",
                    role: "user"
                };
                set({ session, user: userData as User, profile });
            } else {
                set({ session: null, user: null, profile: null });
            }
        });
    },

    signIn: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            set({ isLoading: false });
            return { error: error.message };
        }

        if (data.session?.user) {
            const profile = await fetchProfile(data.session.user.id);
            const userData = profile || {
                id: data.session.user.id,
                email: data.session.user.email || "",
                full_name: data.session.user.user_metadata?.full_name || "User",
                role: "user"
            };
            set({ session: data.session, user: userData as User, profile, isLoading: false });
        } else {
            set({ isLoading: false });
        }

        return {};
    },

    signUp: async (email, password, fullName) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });

        if (error) {
            set({ isLoading: false });
            return { error: error.message };
        }

        if (data.session?.user) {
            const profile = await fetchProfile(data.session.user.id);
            const userData = profile || {
                id: data.session.user.id,
                email: data.session.user.email || "",
                full_name: fullName,
                role: "user"
            };
            set({ session: data.session, user: userData as User, profile, isLoading: false });
        } else {
            set({ isLoading: false });
        }

        return {};
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, session: null });
    },

    setSession: (session) => set({ session }),
}));

async function fetchProfile(userId: string): Promise<User | null> {
    try {
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
    } catch (e) {
        return null;
    }
}
