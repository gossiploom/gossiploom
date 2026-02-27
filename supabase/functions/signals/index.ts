// Edge Function for Signal Operations
// Handles CRUD operations for signals with proper authorization

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignalRequest {
  action: "create" | "update" | "delete" | "get" | "list";
  signalId?: string;
  data?: {
    currency_pair?: string;
    signal_type?: "BUY" | "SELL";
    entry_price?: number;
    stop_loss?: number;
    take_profit?: number;
    signal_visibility?: "free" | "subscribers" | "both";
    description?: string;
    outcome?: "pending" | "win" | "loss" | "breakeven";
    outcome_pips?: number;
  };
  filters?: {
    visibility?: string;
    outcome?: string;
    provider_id?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get user from auth
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const requestData: SignalRequest = await req.json();
    const { action, signalId, data, filters } = requestData;

    // Check user role
    const { data: userRole, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id)
      .single();

    const isAdmin = userRole?.role === "admin";
    const isSignalProvider = userRole?.role === "signal_provider";

    switch (action) {
      case "create": {
        // Only signal providers and admins can create signals
        if (!isSignalProvider && !isAdmin) {
          return new Response(
            JSON.stringify({ error: "Forbidden: Insufficient permissions" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: newSignal, error } = await supabaseClient
          .from("signals")
          .insert({
            provider_id: user?.id,
            currency_pair: data?.currency_pair,
            signal_type: data?.signal_type,
            entry_price: data?.entry_price,
            stop_loss: data?.stop_loss,
            take_profit: data?.take_profit,
            signal_visibility: data?.signal_visibility,
            description: data?.description,
            outcome: "pending",
            published_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data: newSignal }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!signalId) {
          return new Response(
            JSON.stringify({ error: "Signal ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if user owns the signal or is admin
        const { data: existingSignal } = await supabaseClient
          .from("signals")
          .select("provider_id")
          .eq("id", signalId)
          .single();

        if (!isAdmin && existingSignal?.provider_id !== user?.id) {
          return new Response(
            JSON.stringify({ error: "Forbidden: Can only update your own signals" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: updatedSignal, error } = await supabaseClient
          .from("signals")
          .update({
            ...(data?.currency_pair && { currency_pair: data.currency_pair }),
            ...(data?.signal_type && { signal_type: data.signal_type }),
            ...(data?.entry_price !== undefined && { entry_price: data.entry_price }),
            ...(data?.stop_loss !== undefined && { stop_loss: data.stop_loss }),
            ...(data?.take_profit !== undefined && { take_profit: data.take_profit }),
            ...(data?.signal_visibility && { signal_visibility: data.signal_visibility }),
            ...(data?.description !== undefined && { description: data.description }),
            ...(data?.outcome && { outcome: data.outcome }),
            ...(data?.outcome_pips !== undefined && { outcome_pips: data.outcome_pips }),
            updated_at: new Date().toISOString(),
          })
          .eq("id", signalId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data: updatedSignal }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!signalId) {
          return new Response(
            JSON.stringify({ error: "Signal ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Only admins can delete signals
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Forbidden: Only admins can delete signals" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseClient
          .from("signals")
          .delete()
          .eq("id", signalId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: "Signal deleted" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get": {
        if (!signalId) {
          return new Response(
            JSON.stringify({ error: "Signal ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: signal, error } = await supabaseClient
          .from("signals")
          .select("*")
          .eq("id", signalId)
          .single();

        if (error) throw error;

        // Check visibility permissions
        const isOwner = signal.provider_id === user?.id;
        const isVisible = signal.signal_visibility === "free" || 
                         signal.signal_visibility === "both" || 
                         isOwner || 
                         isAdmin;

        if (!isVisible) {
          return new Response(
            JSON.stringify({ error: "Forbidden: Signal not accessible" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: signal }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list": {
        let query = supabaseClient
          .from("signals")
          .select("*")
          .order("created_at", { ascending: false });

        // Apply filters
        if (filters?.visibility) {
          if (filters.visibility === "free") {
            query = query.in("signal_visibility", ["free", "both"]);
          } else if (filters.visibility === "subscribers") {
            query = query.in("signal_visibility", ["subscribers", "both"]);
          } else {
            query = query.eq("signal_visibility", filters.visibility);
          }
        }

        if (filters?.outcome) {
          query = query.eq("outcome", filters.outcome);
        }

        if (filters?.provider_id) {
          // If requesting specific provider's signals
          if (isAdmin || filters.provider_id === user?.id) {
            query = query.eq("provider_id", filters.provider_id);
          } else {
            // Non-admins can only see that provider's public signals
            query = query
              .eq("provider_id", filters.provider_id)
              .in("signal_visibility", ["free", "both"]);
          }
        } else if (!isAdmin) {
          // If no provider filter and not admin, show only user's own signals
          if (isSignalProvider) {
            query = query.eq("provider_id", user?.id);
          }
        }

        const { data: signals, error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data: signals }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
