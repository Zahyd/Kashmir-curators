# 🏔️ Connecting Google Forms & Google Sheets to Kashmir Connect CRM

To automatically pull leads from Google into your **Kashmir Connect Live Leads** sheet, we will bridge your **Google Form** directly to your Kashmir Connect CRM. 

When a guest submits your Google Form, the lead is sent instantly to your CRM database, triggering automatic emails and WebSocket notifications, and appending the lead row right back into your `Kashmir Connect Live Leads` Google Sheet in real-time!

---

## 🛠️ Step-by-Step Integration Guide

We will use a lightweight, free, and real-time **Google Apps Script** inside your Google Form's spreadsheet to bridge submissions.

### Step 1: Create Your Google Form
1. Go to [Google Forms](https://forms.google.com) and design your Inquiry Form. Include fields like:
   * **Full Name**
   * **Email Address**
   * **Phone Number**
   * **Preferred Destination** (e.g., Gulmarg, Pahalgam, Srinagar)
   * **Duration of Stay** (e.g., 5 Days, 6 Days)
   * **Number of Travelers**
   * **Estimated Budget**
   * **Accommodation Tier** (e.g., 3-Star, 5-Star Luxury)

### Step 2: Open the Apps Script Editor
1. In your Google Form, click the **Responses** tab.
2. Click **Link to Sheets** to create or open the response spreadsheet.
3. In the Google Sheet, click **Extensions** in the top menu, then select **Apps Script**.

### Step 3: Paste the Bridge Script
1. Delete any code in the editor, and paste the following high-performance bridge script:

```javascript
/**
 * Kashmir Connect CRM - Real-Time Google Forms Integration Bridge
 * Synchronizes Form Submissions directly to the Kashmir Connect CRM
 */
function onFormSubmit(e) {
  // 1. UPDATE THIS URL to point to your live Kashmir Connect CRM API endpoint!
  // If running locally, you can use an ngrok or LocalTunnel address (e.g. "https://xyz.ngrok-free.app/api/inquiries")
  var backendUrl = "https://kashmir-connect-api.yourdomain.com/api/inquiries"; 
  
  try {
    var itemResponses = e.response.getItemResponses();
    var payload = {
      customerName: "",
      email: "",
      phone: "",
      destination: "Kashmir",
      duration: "6 Days",
      travelers: "2",
      budget: "Premium",
      accommodation: "Luxury Resort"
    };
    
    // Dynamic matching of question titles to Kashmir Connect CRM parameters
    for (var i = 0; i < itemResponses.length; i++) {
      var itemResponse = itemResponses[i];
      var question = itemResponse.getItem().getTitle().toLowerCase();
      var answer = itemResponse.getResponse();
      
      if (question.indexOf("name") !== -1) {
        payload.customerName = answer;
      } else if (question.indexOf("email") !== -1) {
        payload.email = answer;
      } else if (question.indexOf("phone") !== -1 || question.indexOf("contact") !== -1 || question.indexOf("mobile") !== -1) {
        payload.phone = String(answer);
      } else if (question.indexOf("destination") !== -1 || question.indexOf("where") !== -1 || question.indexOf("visit") !== -1) {
        payload.destination = answer;
      } else if (question.indexOf("duration") !== -1 || question.indexOf("days") !== -1 || question.indexOf("night") !== -1) {
        payload.duration = answer;
      } else if (question.indexOf("traveler") !== -1 || question.indexOf("people") !== -1 || question.indexOf("member") !== -1 || question.indexOf("pax") !== -1) {
        payload.travelers = String(answer);
      } else if (question.indexOf("budget") !== -1 || question.indexOf("price") !== -1) {
        payload.budget = answer;
      } else if (question.indexOf("accommodation") !== -1 || question.indexOf("hotel") !== -1 || question.indexOf("stay") !== -1 || question.indexOf("room") !== -1) {
        payload.accommodation = answer;
      }
    }
    
    // Safe fallback validations
    if (!payload.customerName) {
      payload.customerName = "Google Form Lead";
    }
    if (!payload.email) {
      payload.email = "no-email-provided@google.com";
    }
    
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    Logger.log("Dispatching lead payload to Kashmir Connect: " + JSON.stringify(payload));
    var response = UrlFetchApp.fetch(backendUrl, options);
    Logger.log("CRM Server Response Code: " + response.getResponseCode());
    Logger.log("CRM Server Response Body: " + response.getContentText());
    
  } catch (err) {
    Logger.log("Failed to process Google Form ingestion: " + err.toString());
  }
}
```

2. Click the **Save** floppy disk icon in the toolbar.

### Step 4: Configure the Submission Trigger
To make the script run automatically every time a customer submits the form:
1. On the left sidebar of the Apps Script page, click the **Triggers** icon (represented by an alarm clock).
2. Click the blue **+ Add Trigger** button in the bottom right corner.
3. Configure the trigger settings exactly as follows:
   * **Choose which function to run:** `onFormSubmit`
   * **Choose which deployment should run:** `Head`
   * **Select event source:** `From spreadsheet`
   * **Select event type:** `On form submit`
4. Click **Save**.
5. Google will prompt you to authorize permissions for the script to access external networks. Click your Google account, then click **Advanced** -> **Go to Untitled project (unsafe)** and click **Allow**.

---

## 💎 The Seamless Result Loop

Now, the entire pipeline is linked securely:
1. A potential customer submits your **Google Form** inquiry.
2. Google Apps Script fires instantly, packaging the inquiry and dispatching it to your CRM endpoint `/api/inquiries`.
3. Kashmir Connect saves it to your cloud PostgreSQL database, fires an automated email notification, updates your Sales Team dashboard with live WebSocket sounds, and appends the lead right into your **Kashmir Connect Live Leads** Google Sheet in under 1 second!
