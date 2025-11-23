import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

/**
 * API endpoint to receive messages from Telegram bot
 * This endpoint will be called by the bot when it receives a mention
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		// Log the received message for debugging
		console.log("Received message from Telegram:", JSON.stringify(body, null, 2));

		// Here you can process the message and save it to your database
		// or forward it to your tRPC router, etc.

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Error processing Telegram webhook:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

