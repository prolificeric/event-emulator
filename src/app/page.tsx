'use client';

import { useSearchParams } from 'next/navigation';
import { EventHandler, useEffect, useMemo, useState } from 'react';

const fixUrl = (url: string): string => {
  if (!url) {
    return '';
  }

  if (!url.startsWith('http')) {
    return 'https://' + url;
  }

  return url;
};

export default function Home() {
  const params = useSearchParams();
  const url = params.get('url') || '';
  const cleanedUrl = url && fixUrl(url);
  const [events, setEvents] = useState([]);
  const [currentAdapter, setCurrentAdapter] = useState<Adapter>(adapters[0]);

  useEffect(() => {
    const handler: EventHandler<any> = (event) => {
      if (event.data.type === 'data_event') {
        const { payload } = event.data;

        setEvents(
          events.concat({
            event_type: event.data.subtype,
            ...payload,
            ...getFanProperties(),
          }),
        );
      }
    };

    window.addEventListener('message', handler);

    return () => {
      window.removeEventListener('message', handler);
    };
  }, [events]);

  const clearCookies = () => {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.slice(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  return (
    <main className="flex flex-col h-[100vh]">
      <form className="flex gap-2 p-4 items-center bg-gray-800" method="GET">
        <h1 className="font-medium">
          <a href="/">Data Event Emulator</a>
        </h1>

        <select
          className="text-black py-1 px-2 rounded-lg text-sm"
          onChange={(event) => {
            const adapter = adapters.find(
              (adapter) => adapter.key === event.target.value,
            );
            if (adapter) {
              setCurrentAdapter(adapter);
            }
          }}
        >
          {adapters.map((adapter) => (
            <option key={adapter.key} value={adapter.key}>
              {adapter.name}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <input
            type="url"
            name="url"
            placeholder="Enter a page containing a FanPower widget"
            className="text-sm px-4 py-1 rounded-full border w-full text-black"
            defaultValue={url}
          />

          {url && (
            <span className="inline-block absolute right-[3px] top-[3px] text-xs px-3 py-1 rounded-full bg-gray-300 text-gray-600">
              Connector Installed
            </span>
          )}
        </div>

        <button
          className="text-sm py-1 px-4 rounded-md bg-gray-500"
          type="submit"
        >
          Load
        </button>

        <button
          onClick={() => {
            clearCookies();
            window.location.reload();
          }}
          className="text-sm py-1 px-4 rounded-md bg-gray-500"
        >
          Clear State
        </button>
      </form>

      <div className="flex items-stretch h-[calc(100vh-62px)]">
        <iframe
          src={'/proxy?url=' + encodeURIComponent(url)}
          className="flex-1 bg-white"
        />
        <div className="overflow-auto w-[25%] max-w-[600px] min-w-[350px] bg-gray-900 p-4">
          {events.map((event, index) => (
            <pre
              key={index}
              className="block rounded-lg text-xs p-2 text-gray-200 bg-gray-700 overflow-x-auto mb-4"
            >
              {JSON.stringify(currentAdapter.convert(event), null, 2)}
            </pre>
          ))}
        </div>
      </div>
    </main>
  );
}

type Adapter = {
  key: string;
  name: string;
  convert(values: Record<string, any>): any;
};

const adapters: Adapter[] = [
  {
    key: 'tealium',
    name: 'Tealium',
    convert({ event_type, email, trace_id, id, ...rest }) {
      return {
        tealium_event: event_type,
        tealium_account: 'fanpower',
        tealium_profile: 'main',
        tealium_datasource: 'fanpower',
        tealium_visitor_id: `sha256(${['fanpower', 'main', 5102, id].join(
          '_',
        )})`,
        tealium_trace_id: trace_id,
        id,
        email,
        ...rest,
      };
    },
  },
];

const getCookies = () => {
  return Object.fromEntries(
    document.cookie.split(/ ?; ?/).map((cookie) => {
      return cookie.split(/ ?= ?/).map(decodeURIComponent);
    }),
  );
};

const getFanProperties = () => {
  try {
    const cookie = getCookies().pu_fan;
    const parsed = cookie ? JSON.parse(cookie) : {};
    return Object.fromEntries(usedFanProperties.map((k) => [k, parsed[k]]));
  } catch (e) {
    return {};
  }
};

const usedFanProperties = [
  'id',
  'phone_code',
  'phone_number',
  'email',
  'created_at',
  'username',
  'first_name',
  'last_name',
  'hometown',
  'birthday',
  'last_known_city',
  'last_known_state',
];
