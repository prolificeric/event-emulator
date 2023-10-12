/// <reference types="jquery" />
/// <reference types="web" />

{
  const getPropIdFromElement = ($el: JQuery) => {
    return $el.closest('.pickup-js-prop-picker').data('propid').toString();
  };

  const getQuestionFromElement = ($el: JQuery) => {
    return $el.closest('.pickup-js-prop-picker').find('h1:first').text().trim();
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

  const getPageData = () => {
    return {
      page_url: new URL(location.href).searchParams.get('url') || location.href,
      page_title: document.title,
    };
  };

  const emit = (
    type: string,
    payload: Record<string, string | string[] | undefined>,
  ) => {
    const message = {
      type: 'data-event',
      event: {
        type,
        payload: {
          ...getFanData(),
          ...getPageData(),
          ...payload,
        },
      },
    };

    console.log(message);

    window.parent?.postMessage(message);
  };

  $('body').on(
    'click',
    '.pickup-js-prop-picker div[class*=root]:has(button):first button',
    async (event) => {
      const $button = $(event.target);
      const propId = getPropIdFromElement($button);

      emit('picker_pick_click', {
        prop_id: propId,
        button_text: $button.attr('title'),
        question: getQuestionFromElement($button),
      });
    },
  );

  $('body').on(
    'click',
    '.pickup-js-prop-picker div[class*=buttonRoot]:has(button):first button',
    async (event) => {
      const $button = $(event.target);
      const propId = getPropIdFromElement($button);

      emit('picker_share_click', {
        prop_id: propId,
        button_text: $button.attr('title'),
        question: getQuestionFromElement($button),
      });
    },
  );

  $('body').on('submit', '.pickup-js-prop-picker form', async (event) => {
    const $form = $(event.target);
    const propId = getPropIdFromElement($form);

    emit('picker_email_submit', {
      prop_id: propId,
      email: $form.find('input[type=email]').val()?.toString(),
      question: getQuestionFromElement($form),
    });
  });
}
