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
  document.querySelector('#email-detail').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id) {

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    // Print email
    console.log(email);

    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-detail').style.display = 'block';

    // Format body text
    let formattedBody = email.body.replace(/\n/g, '<br>');
    
    document.querySelector('#email-detail').innerHTML = `
      <ul class="list-group" id="email-header">
        <li class="list-group-item"><strong>From: </strong>${email.sender}</li>
        <li class="list-group-item"><strong>To: </strong>${email.recipients}</li>
        <li class="list-group-item"><strong>Subject: </strong>${email.subject}</li>
        <li class="list-group-item"><strong>Timestamp: </strong>${email.timestamp}</li>
        <li class="list-group-item"><p>${formattedBody}</p></li>
      </ul>
      <hr>
    `;

    // When viewed, change email to read
    if (!email.read) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }

    // Reply to email
    const reply_btn = document.createElement('button');
    reply_btn.innerHTML = 'Reply';
    reply_btn.className = 'btn btn-sm btn-secondary';
    reply_btn.addEventListener('click', function() {
      compose_email();

      // Prefill composition fields
      document.querySelector('#compose-recipients').value = email.sender;
      let subject = email.subject;
      if (subject.split(' ',1)[0] != 'Re:') {
        subject = 'Re: ' + email.subject;
      }
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
    });
    document.querySelector('#email-detail').append(reply_btn);
    
    // Archive/unarchive email
    const archive_btn = document.createElement('button');
    archive_btn.innerHTML = email.archived ? 'Unarchive' : 'Archive';
    archive_btn.className = email.archived ? 'btn btn-sm btn-outline-danger' : 'btn btn-sm btn-danger';
    archive_btn.addEventListener('click', function() {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
        })
      })
      .then(() => { load_mailbox('inbox')})
    });
    document.querySelector('#email-detail').append(archive_btn); 
});
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';

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
      newEmail.addEventListener('click', function() {
        view_email(email.id)
      });
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

