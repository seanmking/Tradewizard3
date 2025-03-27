import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Assessment API is working',
      data: {
        steps: [
          { id: 1, name: 'Business Profile' },
          { id: 2, name: 'Product Selection' },
          { id: 3, name: 'Production & Market' },
          { id: 4, name: 'Certifications & Budget' }
        ]
      }
    });
  } catch (error) {
    console.error('Error in assessment GET route:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve assessment data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Process assessment data here
    
    return NextResponse.json({
      success: true,
      message: 'Assessment data received',
      data
    });
  } catch (error) {
    console.error('Error processing assessment data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process assessment data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 