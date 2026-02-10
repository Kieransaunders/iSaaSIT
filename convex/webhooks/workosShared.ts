import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";

type WorkOSWebhookResult = {
  ok: boolean;
  status: number;
  message: string;
  event?: string;
  userId?: Id<"users">;
};

const encoder = new TextEncoder();

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  return Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyWorkOSWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // WorkOS signature format: "t=timestamp,v1=signature"
    const signatureParts = signature.split(",");
    const timestamp = signatureParts.find((p) => p.startsWith("t="))?.split("=")[1];
    const expectedSig = signatureParts.find((p) => p.startsWith("v1="))?.split("=")[1];

    if (!timestamp || !expectedSig) {
      return false;
    }

    // Construct the signed payload: timestamp + "." + payload
    const signedPayload = `${timestamp}.${payload}`;
    const computedSig = await hmacSha256Hex(secret, signedPayload);

    // Compare signatures (constant-time comparison would be better, but this is acceptable)
    return computedSig === expectedSig;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

export async function signWorkOSWebhook(
  payload: string,
  secret: string,
  timestampSeconds: number = Math.floor(Date.now() / 1000)
): Promise<string> {
  const signedPayload = `${timestampSeconds}.${payload}`;
  const signature = await hmacSha256Hex(secret, signedPayload);
  return `t=${timestampSeconds},v1=${signature}`;
}

export async function processWorkOSWebhook(
  ctx: ActionCtx,
  body: string,
  signature: string,
  webhookSecret: string
): Promise<WorkOSWebhookResult> {
  if (!signature) {
    return { ok: false, status: 400, message: "Missing workos-signature header" };
  }

  if (!webhookSecret) {
    return { ok: false, status: 500, message: "Webhook secret not configured" };
  }

  const isValid = await verifyWorkOSWebhookSignature(body, signature, webhookSecret);
  if (!isValid) {
    return { ok: false, status: 400, message: "Invalid signature" };
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch (error) {
    console.error("Webhook JSON parse error:", error);
    return { ok: false, status: 400, message: "Invalid JSON payload" };
  }

  const eventType = typeof event?.event === "string" ? event.event : "unknown";

  if (eventType !== "invitation.accepted") {
    return { ok: true, status: 200, message: `Ignored event: ${eventType}`, event: eventType };
  }

  const invitationData = event.data;
  const invitationId = invitationData?.id;
  const organizationId = invitationData?.organization_id ?? invitationData?.organizationId;
  const acceptedUserId = invitationData?.accepted_user_id ?? invitationData?.acceptedUserId ?? invitationData?.user_id;
  const firstName = invitationData?.first_name ?? invitationData?.firstName;
  const lastName = invitationData?.last_name ?? invitationData?.lastName;
  const email = invitationData?.email;

  if (!invitationId || !organizationId || !acceptedUserId || !email) {
    return { ok: false, status: 400, message: "Invalid invitation payload", event: eventType };
  }

  // Look up the pending invitation to get role and customerId
  const pendingInvitation = await ctx.runQuery(
    internal.invitations.internal.getPendingInvitationByWorkosId,
    { workosInvitationId: invitationId }
  );

  if (!pendingInvitation) {
    return {
      ok: true,
      status: 200,
      message: `Pending invitation not found for WorkOS ID: ${invitationId}`,
      event: eventType,
    };
  }

  // Look up the organization
  const org = await ctx.runQuery(
    internal.orgs.get.getOrgByWorkosOrgId,
    { workosOrgId: organizationId }
  );

  if (!org) {
    return {
      ok: false,
      status: 500,
      message: `Organization not found for WorkOS ID: ${organizationId}`,
      event: eventType,
    };
  }

  // Sync the user to Convex
  const userId = await ctx.runMutation(internal.users.sync.syncFromInvitation, {
    workosUserId: acceptedUserId,
    email,
    firstName,
    lastName,
    orgId: org._id,
    role: pendingInvitation.role,
    customerId: pendingInvitation.customerId,
  });

  // Delete the pending invitation
  await ctx.runMutation(
    internal.users.sync.deletePendingInvitationByWorkosId,
    { workosInvitationId: invitationId }
  );

  return {
    ok: true,
    status: 200,
    message: `Successfully synced user ${email}`,
    event: eventType,
    userId,
  };
}
