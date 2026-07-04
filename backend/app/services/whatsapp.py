from twilio.rest import Client
from ..config import settings

def send_whatsapp_reply(to_number: str, message: str):
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        print("Twilio credentials not configured. WhatsApp reply not sent.")
        print(f"Fallback Log: Sending to {to_number}:\n{message}\n")
        return

    try:
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(
            from_=settings.twilio_whatsapp_number,
            body=message,
            to=to_number
        )
    except Exception as e:
        print(f"Error sending WhatsApp message via Twilio: {e}")
        print(f"Fallback Log: Sending to {to_number}:\n{message}\n")