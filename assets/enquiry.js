/* Draft generation is local. Sending is always owned by the visitor's email app. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.KazeyamiEnquiry = api;
})(typeof window === "object" ? window : this, function () {
  function build(values) {
    const clean = (key, fallback = "—") =>
      String(values[key] || fallback)
        .replace(/\r/g, "")
        .trim();
    const subject = "Project enquiry — " + clean("service", "General enquiry");
    const body = [
      "Name: " + clean("name"),
      "Company: " + clean("company"),
      "Email: " + clean("email"),
      "Country: " + clean("country"),
      "Phone / WhatsApp: " + clean("phone"),
      "Service: " + clean("service"),
      "",
      "Project brief:",
      clean("message"),
    ].join("\n");
    return {
      body,
      subject,
      mailto:
        "mailto:sales@kazeyami.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body),
    };
  }
  return { build };
});
