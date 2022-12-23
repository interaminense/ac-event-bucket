const LOCAL_STORAGE_STATUS = "ac_events_extension_status";
const LOCAL_STORAGE_THEME_NAME = "ac_events_extension_theme_name";

const PREDEFINED_STYLES = {
  fontWeight: "bold",
  padding: "4px 8px",
  borderRadius: "4px",
  marginRight: "4px",
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

function getApplicationIdColorBasedOnThemeName(themeName) {
  if (themeName === "dark") {
    return {
      color: "#333",
      backgroundColor: "#fff",
    };
  }

  return {
    color: "#fff",
    backgroundColor: "#333",
  };
}

function getSecondaryMessageColorBasedOnThemeName(themeName) {
  if (themeName === "dark") {
    return {
      color: "#f0f0f0",
      backgroundColor: "#333",
    };
  }

  return {
    color: "#333",
    backgroundColor: "#f0f0f0",
  };
}

function eventPayload(message, context, event, themeName) {
  return [
    [
      {
        value: event.applicationId,
        style: getStyle({
          ...PREDEFINED_STYLES,
          ...getApplicationIdColorBasedOnThemeName(themeName),
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
          ...getSecondaryMessageColorBasedOnThemeName(themeName),
        }),
      },
      {
        value: convertDate(event.eventDate),
        style: getStyle({
          ...PREDEFINED_STYLES,
          ...getSecondaryMessageColorBasedOnThemeName(themeName),
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

chrome.runtime.onMessage.addListener(function (message) {
  chrome.storage.sync.get([LOCAL_STORAGE_STATUS], function (initialStatus) {
    const status = initialStatus[LOCAL_STORAGE_STATUS] || "enabled";

    if (message.type === "request_report" && status === "enabled") {
      if (message.data.details.url.includes("identity")) {
        print(...identityPayload(message));
      } else {
        const context = { ...message.data.payload };
        delete context.events;

        chrome.storage.sync.get(
          [LOCAL_STORAGE_THEME_NAME],
          function (themeName) {
            message.data.payload.events.forEach((event) => {
              print(
                ...eventPayload(
                  message,
                  context,
                  event,
                  themeName[LOCAL_STORAGE_THEME_NAME]
                )
              );
            });
          }
        );
      }
    }
  });
});
