# Connect a ChatGPT focus coach to Clearpath

Use the Site's connected ChatGPT app for a coach running inside ChatGPT. A raw `cpcoach_…` token by itself cannot pass the private Site's outer access gate.

## Parent setup

1. Open Clearpath while signed into the ChatGPT account that will run the coach.
2. Sign into a Clearpath **parent** account.
3. Open **Coach access**.
4. Create a scoped credential with the desired expiry in months, actions and authorized children. Use a replacement if an earlier secret was pasted into a chat. Keep the secret out of prompts.
5. Under **ChatGPT coach connection**, select that grant and click **Authorize ChatGPT with selected grant**. This is an explicit delegation of the selected scope to your current ChatGPT account.
6. Install/connect the private Clearpath app created by Sites. Look under **Plugins → Personal → Created by you** if it is not already connected.
7. Enable that app in the coach conversation. A new conversation may be needed for newly connected tools to appear.
8. Ask the coach to call **coach_connection_status** first. It must report authenticated access with the intended scopes, child IDs and expiry before the coach writes anything.

The browser parent session is needed only to authorize the connection. The connected tools use the ChatGPT caller's Site identity and the saved grant ID; they do not borrow browser cookies or store a plaintext coach token. No Site-wide service credential is exposed to the coach.

The grant remains subject to expiry, revocation, per-child scope and rate limits. Disconnecting this ChatGPT account removes the tool binding. Revoking the underlying grant disables both its API use and the connected tools. Other ChatGPT accounts need their own parent-approved binding and permission to view the Site.

## Coach tools

| Tool | Purpose |
|---|---|
| `coach_connection_status` | Read-only authentication and grant diagnostic. |
| `coach_list_children` | List only explicitly authorized children; requires assignment or result access. |
| `coach_create_draft` | Create a validated draft from `definition` or `activity_config`; requires `tests:write`. |
| `coach_validate_draft` | Validate a draft owned by this grant. |
| `coach_publish_test` | Publish an immutable draft version; requires `tests:publish`. |
| `coach_assign_test` | Assign a version to selected authorized children; requires `assignments:write:linked`. |
| `coach_list_attempts` | Read an authorized assignment's history; requires `results:read:linked`. |
| `coach_get_report` | Read an authorized attempt report; requires `results:read:linked`. |

Publication and assignment are writes. The coach should use them only within the parent's explicit instructions and granted scopes. A successful status check is not permission to invent or assign a curriculum.

## Raw HTTP clients

A script using the REST API needs two separate credentials, delivered through secure secret storage:

```http
OAI-Sites-Authorization: Bearer <Site service-access credential>
Authorization: Bearer <scoped Clearpath coach credential>
Content-Type: application/json
```

The Site owner supplies supported service access. Do not put the service credential in the app's source, browser code, GitHub, or a chat prompt. The scoped coach credential still enforces child/action permissions after the outer gate is passed.

`GET /v1/connection` verifies the scoped credential and returns its scopes, authorized child IDs and expiry without creating a draft. `GET /v1/children` lists only granted active children, when the credential has linked assignment/result access.

## Production diagnostic performed November 1, 2026

- Coach credential alone: HTTP 401 from the private Site gate; no application authentication result.
- Existing supported Site service-access header plus coach credential: Clearpath JSON responses were reached.
- Invalid draft request: HTTP 400 schema errors, confirming authenticated `tests:write` access without creating a draft.
- Empty-child assignment request: HTTP 403 `Child is outside this credential grant.`, confirming the assignment scope was reached and the child boundary enforced.
- Nonexistent assignment history: HTTP 404 `Assignment not found.`, confirming the result-read scope was reached without exposing records.

No draft, published test or child assignment was created by these diagnostics. The reported Cloudflare 1010 rejection was not reproduced from this computer; that report came from a different caller environment. A successful script test does not by itself prove that a ChatGPT conversation has connected tools.

## Troubleshooting

- **No Clearpath tools in ChatGPT:** install/connect the Site's private app and enable it in the coach conversation.
- **Parent authorization required:** complete the grant selection under Coach access using the same ChatGPT account.
- **Expired/revoked credential:** create/select a new active grant; old bindings do not gain extra permissions automatically.
- **Missing scope / child outside grant:** have a parent review the chosen grant. Do not substitute other IDs to bypass the boundary.
- **Cloudflare HTML 403/1010:** the request was rejected before the application. Use the supported connected app, or report the failing supported route and Cloudflare Ray ID to platform support. Do not impersonate browser signatures or weaken the Site's access policy.
