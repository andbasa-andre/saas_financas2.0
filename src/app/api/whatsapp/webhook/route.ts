import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
    }

    // Parse simple patterns (Ex: "Gastei 87 no supermercado hoje")
    const lower = message.toLowerCase();
    let type = 'expense';
    if (lower.includes('recebi') || lower.includes('ganhei')) {
      type = 'income';
    }

    const matchAmount = message.match(/(\d+([.,]\d{1,2})?)/);
    const amount = matchAmount ? parseFloat(matchAmount[1].replace(',', '.')) : 0;

    return NextResponse.json({
      status: 'pending_confirmation',
      parsedPayload: {
        userId,
        type,
        amount,
        rawMessage: message,
        requiresConfirmation: true
      },
      message: `Saída de R$ ${amount.toFixed(2)} identificada. Deseja registrar?`
    });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 });
  }
}
