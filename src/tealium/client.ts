export type TealiumClientOpts = {
  collectUrl?: string;
};

export type CollectStandardFields = {
  account: string;
  event: string;
  datasource?: string;
  profile?: string;
  visitorIdAttributeNumber?: number;
  visitorId?: string;
  thirdPartyVisitorId?: string;
  firstPartyVisitorId?: string;
  traceId?: string;
  properties?: Record<string, any>;
};

export type CollectEvent<
  TProperties extends Record<string, any> = Record<string, any>,
> = CollectStandardFields & {
  event: string;
  properties?: TProperties;
};

export class TealiumClient {
  collectUrl: string;

  constructor({
    collectUrl = 'https://collect.tealiumiq.com',
  }: TealiumClientOpts) {
    this.collectUrl = collectUrl;
  }

  async request<TData = unknown>(
    method: 'GET' | 'POST' | 'PUT',
    url: string,
    inputs: Record<string, any> = {},
  ) {
    let qs = '';
    let body: undefined | string = undefined;

    if (method === 'GET') {
      qs = '?' + new URLSearchParams(inputs).toString();
    } else {
      body = JSON.stringify(inputs);
    }

    const response = await fetch(url + qs, {
      method,
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.json() as Promise<TData>;
  }

  async pushEvent({
    event,
    properties,
    account,
    profile = 'main',
    datasource,
    traceId,
    visitorIdAttributeNumber = 7688,
    visitorId,
    thirdPartyVisitorId,
    firstPartyVisitorId,
  }: CollectEvent) {
    return this.request('POST', `${this.collectUrl}/event`, {
      ...properties,
      tealium_account: account,
      tealium_profile: profile,
      tealium_datasource: datasource,
      tealium_event: event,
      tealium_trace_id: traceId,
      tealium_visitor_id:
        visitorId &&
        `__${account}_${profile}__${visitorIdAttributeNumber}_${visitorId}__`,
      tealium_first_party_visitor_id: firstPartyVisitorId,
      tealium_third_party_visitor_id: thirdPartyVisitorId,
    });
  }
}
