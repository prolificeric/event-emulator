/// <reference types="jquery" />
/// <reference types="web" />

{
  const $logger = $('.fp-tealium-console ul');

  const getPropIdFromElement = ($el: JQuery) => {
    return $el.closest('.pickup-js-prop-picker').data('propid').toString();
  };

  const getQuestionFromElement = ($el: JQuery) => {
    return $el.closest('.pickup-js-prop-picker').find('h1:first').text().trim();
  };

  const deleteAllCookies = () => {
    var c = document.cookie.split('; ');

    for (let i = 0; i < c.length; i++) {
      document.cookie =
        /^[^=]+/.exec(c[i])[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  const appendLog = (message: any) => {
    const $message = $('<pre />').text(
      typeof message === 'object' ? JSON.stringify(message, null, 2) : message,
    );

    const $item = $('<li class="message" />').append($message);

    $logger.append($item);

    $logger.scrollTop($logger.prop('scrollHeight'));

    return $item;
  };

  const getCookies = () => {
    return Object.fromEntries(
      document.cookie.split(/; */).map((c) => {
        return c.split('=').map(decodeURIComponent);
      }),
    );
  };

  const fanDataKeys = new Set([
    'id',
    'email',
    'phone_code',
    'created_at',
    'username',
    'last_known_city',
    'last_known_state',
    'sms_opt_out',
  ]);

  const getFanData = () => {
    try {
      const cookies = getCookies();
      const data = JSON.parse(cookies.pu_fan);

      return Object.fromEntries(
        Object.entries(data)
          .filter(([key, value]) => {
            return fanDataKeys.has(key) && ![null, undefined].includes(value);
          })
          .map(([key, value]) => {
            if (typeof value === 'boolean') {
              return [key, value ? '1' : '0'];
            }

            return [key, value.toString()];
          }),
      );
    } catch (e) {
      return {};
    }
  };

  const baseTealium = {
    tealium_account: 'fanpower',
    tealium_profile: 'main',
    tealium_datasource: 'web',
    tealium_trace_id: crypto.randomUUID(),
  };

  const createTealiumEvent = (
    data: Record<string, string | string[] | undefined>,
  ) => {
    return {
      ...baseTealium,
      ...data,
      ...getFanData(),
    };
  };

  $('body').on('click', '.fp-tealium-clear-cookies', async () => {
    deleteAllCookies();
    location.reload();
  });

  $('body').on(
    'click',
    '.pickup-js-prop-picker div[class*=root]:has(button):first button',
    async (event) => {
      const $button = $(event.target);
      const propId = getPropIdFromElement($button);

      appendLog(
        createTealiumEvent({
          tealium_event: 'picker_pick_click',
          prop_id: propId,
          button_text: $button.attr('title'),
          question: getQuestionFromElement($button),
        }),
      );
    },
  );

  $('body').on(
    'click',
    '.pickup-js-prop-picker div[class*=buttonRoot]:has(button):first button',
    async (event) => {
      const $button = $(event.target);
      const propId = getPropIdFromElement($button);

      appendLog(
        createTealiumEvent({
          tealium_event: 'picker_share_click',
          prop_id: propId,
          button_text: $button.attr('title'),
          question: getQuestionFromElement($button),
        }),
      );
    },
  );

  $('body').on('submit', '.pickup-js-prop-picker form', async (event) => {
    const $form = $(event.target);
    const propId = getPropIdFromElement($form);

    appendLog(
      createTealiumEvent({
        tealium_event: 'picker_email_submit',
        prop_id: propId,
        email: $form.find('input[type=email]').val()?.toString(),
        question: getQuestionFromElement($form),
      }),
    );
  });
}
