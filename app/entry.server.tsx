import {
  type AppLoadContext,
  type EntryContext,
  ServerRouter,
} from 'react-router';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';

export const streamTimeout = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  // If you have middleware enabled:
  // loadContext: RouterContextProvider
  _loadContext: AppLoadContext,
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  const userAgent = request.headers.get('user-agent');
  // Crawler & SPA mode menunggu seluruh konten selesai dirender
  const waitForAllContent =
    (userAgent && isbot(userAgent)) || routerContext.isSpaMode;

  let statusCode = responseStatusCode;
  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: AbortSignal.timeout(streamTimeout + 1_000),
      onError(error: unknown) {
        statusCode = 500;
        console.error(error);
      },
    },
  );

  if (waitForAllContent) {
    await stream.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(stream, {
    status: statusCode,
    headers: responseHeaders,
  });
}
