/// <reference types="jquery" />
/// <reference types="web" />

{
  type Adapter = {
    key: string;
    name: string;
    convert(event: DataEvent): Record<string, string>;
  };

  type DataEvent = {
    type: string;
    payload: Record<string, string>;
  };

  globalThis.mountConsole = (opts: { root: any; adapterSelector: any }) => {
    const $logContainer = $(opts.root).eq(0);
    const $adapterSelector = $(opts.adapterSelector).eq(0);

    const traceId = crypto.randomUUID();

    const adapters: Adapter[] = [
      {
        key: 'tealium',
        name: 'Tealium',
        convert(event: DataEvent) {
          return {
            tealium_event: event.type,
            tealium_account: 'fanpower',
            tealium_profile: 'main',
            tealium_datasource: 'web',
            tealium_trace_id: traceId,
            ...event.payload,
          };
        },
      },
    ];

    let curAdapter = adapters[0];

    adapters.forEach((adapter) => {
      const $option = $(
        `<option value="${adapter.key}">${adapter.name}</option>`,
      );

      $adapterSelector.append($option);
    });

    $adapterSelector.on('change', () => {
      curAdapter = adapters.find((a) => a.key === $adapterSelector.val());
    });

    const appendLog = (event: DataEvent) => {
      const message = curAdapter.convert(event);

      const $message = $('<pre />').text(
        typeof message === 'object'
          ? JSON.stringify(message, null, 2)
          : message,
      );

      const $item = $('<li class="message" />').append($message);

      $logContainer.append($item);
      $logContainer.scrollTop($logContainer.prop('scrollHeight'));

      return $item;
    };

    window.addEventListener('message', (message) => {
      if (message.data.type === 'data-event') {
        appendLog(message.data.event);
      }
    });
  };
}
