const PREDEFINED_STYLES = {
  fontWeight: "bold",
  padding: "5px 10px",
  borderRadius: "5px",
  marginRight: "5px",
};

function convertDate(dateStr) {
  const date = new Date(dateStr);
  const convertedDate = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });

  return convertedDate;
}

function getIndividualsMessage(emailAddressHashed) {
  return emailAddressHashed ? "Known" : "Anonymous";
}

function print(values, obj) {
  const styles = [];

  let valueString = "";

  values.forEach(({ value, style }) => {
    valueString += `%c${value}`;

    styles.push(style);
  });

  console.log(valueString, ...styles, obj);
}

function convertCamelCaseToKebab(prop) {
  return prop.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function getStyle(styleProps) {
  let styleString = "";

  for (const prop in styleProps) {
    const kebabProp = convertCamelCaseToKebab(prop);

    styleString += `${kebabProp}: ${styleProps[prop]}; `;
  }

  return styleString;
}

function isValid(message) {
  return message.type === "request_report" && message.data.status === "enabled";
}

function identityPayload(message) {
  return [
    [
      {
        value: "Identity",
        style: getStyle({
          ...PREDEFINED_STYLES,
          color: "#333",
          backgroundColor: "#8bc34a",
        }),
      },
      {
        value: getIndividualsMessage(message.data.payload.emailAddressHashed),
        style: getStyle({
          ...PREDEFINED_STYLES,
          color: "#333",
          backgroundColor: "#f0f0f0",
        }),
      },
    ],
    {
      payload: message.data.payload,
    },
  ];
}

function eventPayload(message, context, event) {
  return [
    [
      {
        value: event.applicationId,
        style: getStyle({
          ...PREDEFINED_STYLES,
          color: "#fff",
          backgroundColor: "#333",
        }),
      },
      {
        value: event.eventId,
        style: getStyle({
          ...PREDEFINED_STYLES,
          color: "#333",
          backgroundColor: "#80acff",
        }),
      },
      {
        value: getIndividualsMessage(message.data.payload.emailAddressHashed),
        style: getStyle({
          ...PREDEFINED_STYLES,
          color: "#333",
          backgroundColor: "#f0f0f0",
        }),
      },
      {
        value: convertDate(event.eventDate),
        style: getStyle({
          ...PREDEFINED_STYLES,
          color: "#333",
          backgroundColor: "#f0f0f0",
        }),
      },
    ],
    {
      payload: {
        event,
        ...context,
      },
    },
  ];
}

(() => {
  chrome.runtime.onMessage.addListener(function (message) {
    if (isValid(message)) {
      if (message.data.details.url.includes("identity")) {
        print(...identityPayload(message));
      } else {
        const context = { ...message.data.payload };
        delete context.events;

        message.data.payload.events.forEach((event) => {
          print(...eventPayload(message, context, event));
        });
      }
    }
  });
})();
