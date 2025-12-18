import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HeadingAnalyzerService } from './services/HeadingAnalyzerService';

/**
 * Lambda handler for analyzing heading structure
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Request body is required',
          message: 'Please provide a JSON body with a "url" field'
        })
      };
    }

    const body = JSON.parse(event.body);
    const { url } = body;

    // Validate URL
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid URL',
          message: 'Please provide a valid URL in the request body'
        })
      };
    }

    // Analyze the URL
    const analyzer = new HeadingAnalyzerService();
    const result = await analyzer.analyzeUrl(url);

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error analyzing URL:', error);

    // Determine error type and status code
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      errorMessage = error.message;

      // If it's a URL fetch error, return 400
      if (errorMessage.includes('Failed to fetch URL') ||
          errorMessage.includes('URL cannot be null')) {
        statusCode = 400;
      }
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        error: 'Analysis failed',
        message: errorMessage
      })
    };
  }
};
