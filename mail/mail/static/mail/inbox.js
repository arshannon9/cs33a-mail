document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Handle submission of compose email form
  document.querySelector('#compose-form').addEventListener('submit', send_email);
  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Retrieve emails for user mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Loop through emails
    emails.forEach(email => {

      console.log(email);

      // Create div to display each email
      const newEmail = document.createElement('div');
      newEmail.className = 'list-group-item';
      newEmail.innerHTML = `
        <h6>From: ${email.sender}</h6>
        <h5>Subject: ${email.subject}</h5>
        <p>${email.timestamp}</p>
      `;

      // Change background color if email read using ternary operator
      newEmail.className += email.read ? ' read' : ' unread';

      
      // Add click event to view email
      newEmail.addEventListener('click', view_email(email.id));
      document.querySelector('#emails-view').append(newEmail);
    })
});
}

function send_email(event) {
  
  event.preventDefault();
  
  // Store values of composition fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send data to backend API
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result to console
      console.log(result);
      // After email is sent, load user's sent mailbox
      load_mailbox('sent');
  });
}

function view_email(id) {
  console.log(id);
}