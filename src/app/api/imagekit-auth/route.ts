
import { NextResponse } from 'next/server';
import { getClientSideAuthParams } from '@/actions/imageKitActions';

export async function GET() {
  try {
    const authResult = await getClientSideAuthParams();
    if (authResult.success) {
      return NextResponse.json(authResult.params);
    } else {
      return NextResponse.json({ error: authResult.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[api/imagekit-auth] Error:', error);
    return NextResponse.json({ error: 'Internal server error generating ImageKit auth params' }, { status: 500 });
  }
}
