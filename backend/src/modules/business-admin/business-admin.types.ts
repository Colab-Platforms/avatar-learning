export interface WhatsappOverview {
  totalInbound: number;
  totalOutbound: number;
  inboundLast24h: number;
  inboundLast7d: number;
  lastInboundAt: string | null;
  contacts: number;
}

export interface BusinessAdminStore {
  overview(now?: Date): Promise<WhatsappOverview>;
}

/** Non-secret integration state: booleans only, never values. */
export interface IntegrationStatus {
  whatsapp: {
    webhookEnabled: boolean;
    webhookConfigured: boolean;
    missingVariables: string[];
    accessTokenSet: boolean;
    phoneNumberIdSet: boolean;
    /** WHATSAPP_OUTBOUND_ENABLED is on (a deliberate switch, separate from receiving). */
    outboundEnabled: boolean;
    /** "ready" only when the integration is enabled, credentialed AND outbound is switched on. */
    outboundSending: "inactive" | "ready";
  };
  email: { configured: boolean };
}
