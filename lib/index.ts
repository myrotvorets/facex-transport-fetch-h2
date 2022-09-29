import { Response, fetch, timeoutSignal } from '@adobe/fetch';
import { FaceXError, HttpError, IRemoteTransport, NetworkError } from '@myrotvorets/facex-base';

export class TransportFetch implements IRemoteTransport {
    // eslint-disable-next-line class-methods-use-this
    public async post(url: URL, body: string, headers: Record<string, string>, timeout: number): Promise<string> {
        const r = await TransportFetch._fetch(url, body, headers, timeout);

        if (!r.ok) {
            const err = new HttpError(r);
            try {
                err.body = await r.text();
            } catch (e) {
                err.body = '';
            }

            throw err;
        }

        return TransportFetch._getText(r);
    }

    private static _fetch(url: URL, body: string, headers: Record<string, string>, timeout: number): Promise<Response> {
        const signal = timeoutSignal(timeout);
        return fetch(url.toString(), { method: 'POST', body, headers, signal }).catch((e: Error) => {
            throw new NetworkError(e.message);
        });
    }

    private static _getText(r: Response): Promise<string> {
        return r.text().catch((e: Error) => {
            throw new FaceXError(e.message);
        });
    }
}
