/// <reference types="jquery" />
/// <reference types="web" />

$(function () {
  const traceId = crypto.randomUUID();

  const pageContext = {
    page_url: new URL(location.href).searchParams.get('url'),
    page_title: document.title,
  };

  const emitDataEvent = (subtype, properties = {}) => {
    window.parent?.postMessage({
      type: 'data_event',
      subtype,
      payload: {
        trace_id: traceId,
        ...pageContext,
        ...properties,
      },
    });
  };

  setTimeout(() => {
    emitDataEvent('page_view', {});
  }, 100);

  const getPropContext = ($el) => {
    const $container = $el.closest('[data-propid]');
    return {
      prop_id: $container.data('propid'),
      prop_question: $container.find('h1').text().trim(),
    };
  };

  $('body').on(
    'click',
    '.pickup-js-prop-picker [class*="wrapper"] button',
    (event) => {
      const $el = $(event.target);
      const $prevs = $el.prevAll();
      const isPick = $el.find('[class*="resultText"]:first').length === 0;

      if (isPick) {
        const propContext = getPropContext($el);

        return emitDataEvent('pick_click', {
          pick_text: $el.text().trim(),
          pick_index: $prevs.get().length,
          ...propContext,
        });
      }
    },
  );

  $('body').on('submit', '.pickup-js-prop-picker form', (event) => {
    const $el = $(event.target);
    const $email = $el.find('input[type="email"]:first');

    if (!$email.get().length) {
      return;
    }

    const propContext = getPropContext($el);

    return emitDataEvent('pick_verify', {
      email: $email.val(),
      ...propContext,
    });
  });

  $('body').on(
    'click',
    '.pickup-js-prop-picker [class*="buttonRoot"] button',
    (event) => {
      const $button = $(event.target);
      const propContext = getPropContext($button);

      return emitDataEvent('share_button_click', {
        share_button_type: $button.attr('title'),
        ...propContext,
      });
    },
  );
});
