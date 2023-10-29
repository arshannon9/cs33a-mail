document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // Handle submission of compose email form
  document
    .querySelector("#compose-form")
    .addEventListener("submit", send_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#mailbox-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#email-view").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function view_email(id, mailbox) {
  // Fetch email by ID
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      document.querySelector("#mailbox-view").style.display = "none";
      document.querySelector("#compose-view").style.display = "none";
      document.querySelector("#email-view").style.display = "block";

      // Format and display the email
      let formattedBody = email.body.replace(/\n/g, "<br>");

      // Display email subject with "(No subject)" if it's empty
      const emailSubject = email.subject ? email.subject : "(No subject)";

      document.querySelector("#email-view").innerHTML = `
      <div class="email-header">
        <ul id="email-info">
          <li><strong>From: </strong>${email.sender}</li>
          <li><strong>To: </strong>${email.recipients}</li>
          <li><strong>Subject: </strong>${emailSubject}</li>
          <li><strong>Timestamp: </strong>${email.timestamp}</li>
        </ul>
      </div>
      <hr>
      <div class="email-body">
        <p>${formattedBody}</p>
      </div>
      <hr>
    `;

      // When viewed, change email to read
      if (!email.read) {
        fetch(`/emails/${email.id}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true,
          }),
        });
      }

      // Reply to email
      const reply_btn = document.createElement("button");
      reply_btn.innerHTML = "Reply";
      reply_btn.className = "btn btn-sm btn-primary";
      reply_btn.addEventListener("click", function () {
        compose_email();

        // Prefill composition fields
        document.querySelector("#compose-recipients").value = email.sender;
        let subject = email.subject;
        if (subject.split(" ", 1)[0] != "Re:") {
          subject = "Re: " + email.subject;
        }
        document.querySelector("#compose-subject").value = subject;
        document.querySelector(
          "#compose-body"
        ).value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
        document.querySelector("#compose-body").focus();
        document.querySelector("#compose-body").setSelectionRange(0, 0);
      });
      document.querySelector("#email-view").append(reply_btn);

      // Archive/unarchive email (if applicable)
      if (mailbox !== "sent") {
        const archive_btn = document.createElement("button");
        archive_btn.innerHTML = email.archived ? "Unarchive" : "Archive";
        archive_btn.className = email.archived
          ? "btn btn-sm btn-outline-danger"
          : "btn btn-sm btn-danger";
        archive_btn.addEventListener("click", function () {
          fetch(`/emails/${email.id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: !email.archived,
            }),
          }).then(() => {
            load_mailbox("inbox");
          });
        });
        document.querySelector("#email-view").append(archive_btn);
      }
    });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#mailbox-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";

  // Store current mailbox in variable
  let current_mailbox = mailbox;

  // Show the mailbox name
  document.querySelector("#mailbox-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  // Determine whether to display sender or recipient based on the current mailbox
  const displayField = mailbox === "sent" ? "recipients" : "sender";

  // Retrieve emails for user mailbox
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Loop through emails and display them
      emails.forEach((email) => {
        const newEmail = document.createElement("div");
        const emailSubject = email.subject ? email.subject : "(No subject)";
        newEmail.className = "list-group-item";
        newEmail.innerHTML = `
        <h6><strong>${
          displayField === "sender"
            ? "From: " + email.sender
            : "To: " + email.recipients
        }</strong></h6>
        <h5><strong>Subject: </strong>${emailSubject}</h5>
        <p>${email.timestamp}</p>
      `;

        // Change background color if email read
        newEmail.className += email.read ? " read" : " unread";

        // Add click event to view email
        newEmail.addEventListener("click", function () {
          view_email(email.id, current_mailbox);
        });
        document.querySelector("#mailbox-view").append(newEmail);
      });
    });
}

function send_email(event) {
  // Prevent the default form submission
  event.preventDefault();

  // Store values of composition fields
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  // Send data to backend API to send email
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      // After email is sent, load user's sent mailbox
      load_mailbox("sent");
    });
}
