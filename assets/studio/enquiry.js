/* Email preparation only: the visitor reviews and sends the draft in their email app. */
(() => {
  "use strict";
  function build(values) {
    const field = (name) => String(values[name] || "").trim();
    const service = field("service") || "A project";
    const body = [
      "Name: " + field("name"),
      "Company: " + (field("company") || "—"),
      "Email: " + field("email"),
      "Country: " + field("country"),
      "Phone / WhatsApp: " + (field("phone") || "—"),
      "Service: " + service,
      "",
      "Project brief:",
      field("message"),
    ].join("\n");
    return (
      "mailto:hr@kazeyami.com?subject=" +
      encodeURIComponent("Project enquiry — " + service) +
      "&body=" +
      encodeURIComponent(body)
    );
  }
  window.StudioBrief = Object.freeze({ build });
})();
