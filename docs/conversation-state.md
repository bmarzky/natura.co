# Natura House Conversation State V1

## Tujuan

Conversation State menyimpan konteks percakapan pelanggan agar AI dapat memahami pesan yang dikirim secara bertahap.

Conversation State berbeda dengan Order State:

- Conversation State = konteks percakapan.
- Order State = data pesanan.

---

## Conversation State

```json
{
  "customer_phone": null,
  "current_intent": null,
  "current_order_id": null,
  "last_message": null,
  "last_ai_action": null,
  "conversation_status": "active"
}