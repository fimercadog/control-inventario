# Criterios de Aceptación (cross-reference)

> Cruza lo construido (Auth Módulos 0-2, Captura IA) contra criterios de aceptación verificables. Cada criterio referencia el test o la verificación manual que lo respalda.

## Autenticación (Auth Módulo 1)

| Criterio | Verificado por |
|---|---|
| Un usuario con credenciales válidas puede iniciar sesión y recibe un access token + cookie de refresh httpOnly | `AuthenticationTest::test_a_user_can_log_in_with_valid_credentials` |
| Credenciales inválidas nunca revelan si falló el email o el password | `AuthenticationTest::test_login_fails_with_the_wrong_password_and_never_reveals_which_field_was_wrong` |
| Una cuenta inactiva no puede iniciar sesión | `AuthenticationTest::test_an_inactive_users_login_is_rejected` |
| Un email sin verificar no puede iniciar sesión | `AuthenticationTest::test_a_user_with_an_unverified_email_cannot_log_in` |
| El refresh token rota en cada uso; el anterior deja de servir | `AuthenticationTest::test_refresh_rotates_the_token_and_the_old_one_stops_working` |
| Cerrar sesión revoca la sesión y pone en blacklist el access token | `AuthenticationTest::test_logout_revokes_the_session_and_blacklists_the_access_token` |
| Ninguna ruta de negocio acepta requests anónimas | `AuthenticationTest::test_business_routes_reject_anonymous_requests` |
| "Olvidé mi contraseña" responde igual exista o no el email | `PasswordResetTest::test_forgot_password_always_responds_generically_even_for_an_unknown_email` |
| Restablecer contraseña revoca todas las sesiones activas del usuario | `PasswordResetTest::test_a_user_can_reset_their_password_with_a_valid_token_and_all_sessions_are_revoked` |
| Verificado en navegador real: cookie httpOnly invisible a JS, sesión sobrevive reload duro, "Remember Me" extiende expiración a 30 días | Verificación manual (roadmap), reconstruida en `ManualTestCases.md` |

## Aislamiento por empresa (Auth Módulo 2)

| Criterio | Verificado por |
|---|---|
| Ninguna empresa puede ver, confirmar, descartar o corregir una captura de otra empresa | `CompanyIsolationHttpTest` (10 tests) |
| `empresa_id` forjado en el body o en el query string se ignora siempre | `CompanyIsolationHttpTest::test_a_forged_empresa_id_in_the_payload_is_ignored_on_create`, `..._in_the_query_string_is_ignored_on_index` |
| Sin contexto de tenant resuelto, las queries devuelven cero filas, nunca todas | `TenantScopeTest::test_without_any_tenant_context_queries_return_zero_rows_not_all_rows` |
| Las Policies niegan acceso cruzado aun si el scope se bypasea a mano | `TenantScopeTest::test_the_policy_still_denies_access_even_if_the_scope_is_explicitly_bypassed`, `test_movimiento_policy_denies_cross_company_access_even_with_the_scope_bypassed` |
| El Platform Super Admin ve datos de todas las empresas, por diseño | `TenantScopeTest::test_a_platform_admin_bypasses_tenant_scope_and_sees_every_companys_products` |
| Un rol otorgado en una empresa no se filtra a otra | `RbacFoundationTest::test_a_role_granted_in_one_empresa_does_not_leak_into_another` |

## Captura IA

| Criterio | Verificado por |
|---|---|
| Una foto con productos idénticos genera un único producto/movimiento con cantidad sumada | `CapturaIAServiceTest::test_photo_with_several_identical_products_creates_a_single_product_with_summed_quantity` |
| Una foto con productos distintos genera una entrada por producto | `CapturaIAServiceTest::test_photo_with_different_products_creates_one_entry_per_product` |
| Confianza ≥ 0.85 aplica automáticamente (sin intervención humana) | `ApplyInventoryMovementActionTest::test_high_confidence_creates_product_and_movement_automatically` |
| Confianza < 0.85 queda en cola de revisión, sin tocar `productos`/`movimientos` | `ApplyInventoryMovementActionTest::test_low_confidence_is_sent_to_review_without_touching_stock` |
| Un detalle pendiente puede corregirse manualmente antes de confirmar | `CapturaIAControllerTest::test_pending_detail_can_be_corrected_before_confirming` |
| Confirmar aplica todo lo pendiente/corregido de una captura | `CapturaIAControllerTest::test_low_confidence_detection_can_be_confirmed_manually` |
| Descartar una captura no toca `productos`/`movimientos` | `CapturaIAControllerTest::test_capture_can_be_discarded` |
| Reintentar con la misma `Idempotency-Key` no reprocesa ni duplica | `CapturaIAControllerTest::test_repeating_the_same_idempotency_key_header_returns_the_original_capture_without_reprocessing`, `ArchitectureReviewTest::test_processing_the_same_idempotency_key_twice_does_not_duplicate_inventory` |
| Un fallo a mitad de una captura revierte TODO lo ya escrito | `ArchitectureReviewTest::test_a_failure_mid_capture_rolls_back_every_product_and_movement_already_written` |
| Los eventos de dominio se disparan tras éxito y nunca tras rollback | `ArchitectureReviewTest::test_domain_events_are_dispatched_after_a_successful_capture`, `test_events_are_not_dispatched_when_the_capture_transaction_rolls_back` |
| Ningún error de proveedor de IA filtra el mensaje del vendor | `ErrorHandlingTest::test_an_ai_provider_failure_never_leaks_the_vendor_message_or_status_code` |

## Frontend (verificación manual, sin automatización — ver `ManualTestCases.md`)

| Criterio | Verificado por |
|---|---|
| El walkthrough completo de Captura IA (Foto+Voz → revisión → confirmación → dashboard actualizado) funciona de punta a punta | RC1 walkthrough manual |
| La UI responde correctamente en mobile/tablet/desktop | Revisión responsive manual |
| El login real (Módulo 1) funciona en navegador real, con cookie httpOnly y refresh silencioso | Verificación de login manual |

## Gaps de criterios sin verificación

- Accesibilidad: ningún criterio fue siquiera definido (ver `docs/02_REQUIREMENTS/AccessibilityRequirements.md` — gap reconocido ahí también).
- Performance: ningún criterio de tiempo de respuesta o carga fue definido ni verificado (ver `PerformanceTests.md`).
