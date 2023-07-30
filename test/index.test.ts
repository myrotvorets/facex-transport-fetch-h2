import * as f from '@adobe/fetch';
import { FaceXError, HttpError, NetworkError } from '@myrotvorets/facex-base';
import { TransportFetch } from '../lib';

jest.mock('@adobe/fetch');

const mockedFetch = f.fetch as jest.MockedFunction<typeof f.fetch>; // NOSONAR
const { Response, timeoutSignal } = jest.requireActual<typeof f>('@adobe/fetch');

(f.timeoutSignal as jest.MockedFunction<typeof f.timeoutSignal>).mockImplementation((ms) => timeoutSignal(ms));

describe('TransportFetch', () => {
    const transport = new TransportFetch();

    it('should throw NetworkError on fetch error', () => {
        const r = new Error('message');
        mockedFetch.mockRejectedValue(r);

        return expect(transport.post(new URL('http://example.com/'), '', {}, 15000)).rejects.toThrow(NetworkError);
    });

    it('should throw HttpError on HTTP error (1)', () => {
        const r = new Response('Ignored', { status: 404, statusText: 'Not Found' });
        mockedFetch.mockResolvedValue(r);

        return expect(transport.post(new URL('http://example.com/'), '', {}, 15000)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on HTTP error (2)', () => {
        const r = new Response('Ignored', { status: 404, statusText: 'Not Found' });
        mockedFetch.mockResolvedValue(r);

        return expect(transport.post(new URL('http://example.com/'), '', {}, 15000)).rejects.toMatchObject({
            code: 404,
            statusText: 'Not Found',
            body: 'Ignored',
        });
    });

    it('should tolerate errors in text() in HttpError handler', () => {
        const r = new Response('Ignored', { status: 400, statusText: 'Bad, Bad Request' });
        r.text = jest.fn().mockRejectedValue(new Error('Unknown error'));
        mockedFetch.mockResolvedValue(r);

        return expect(transport.post(new URL('http://example.com/'), '', {}, 15000)).rejects.toMatchObject({
            code: 400,
            statusText: 'Bad, Bad Request',
            body: '',
        });
    });

    it('should throw FaceXError on any other error', () => {
        const r = new Response('Ignored', { status: 200, statusText: 'OK' });
        r.text = jest.fn().mockRejectedValue(new Error('Unknown error'));
        mockedFetch.mockResolvedValue(r);

        return expect(transport.post(new URL('http://example.com/'), '', {}, 15000)).rejects.toThrow(FaceXError);
    });
});
