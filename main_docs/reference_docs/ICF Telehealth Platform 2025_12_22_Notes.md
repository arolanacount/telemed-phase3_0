# 📝 Notes

Dec 22, 2025

## ICF Telehealth Platform

Invited [Ilya Rabkin](mailto:ilya.rabkin@intellibus.com) [Daniel Callaghan](mailto:daniel.callaghan@intellibus.com) [Dennis Wilmot](mailto:dennis.wilmot@intellibus.com) [Ed Watal](mailto:ed@intellibus.com) [nixackount@gmail.com](mailto:nixackount@gmail.com) [Graeme Thomson](mailto:graeme.thomson@intellibus.com) [Justin Brown](mailto:justin.brown@intellibus.com) [shevanisegivans44@gmail.com](mailto:shevanisegivans44@gmail.com) [Daena Crosby](mailto:daena.crosby@intellibus.com)

Attachments [ICF Telehealth Platform](https://www.google.com/calendar/event?eid=NGE5bzlhZTIzaHZldDE5dmMwMHN2OG9lNDEgaWx5YS5yYWJraW5AaW50ZWxsaWJ1cy5jb20) [Notes by Gemini](https://docs.google.com/document/d/1XStwxPfZsYmtY08eWkY0SGrd0bUCrKXMyAVpoQUzNDY/edit?usp=meet_tnfm_calendar) [Notes by Gemini](https://docs.google.com/document/d/15aFIR0skhdXyr4q-qTTjrpuLSS-AsqtJ0Fe5pJDkXck/edit?usp=meet_tnfm_calendar) 

Meeting records [Transcript](?tab=t.gb8p8ux9mjaq) 

### Summary

Ilya Rabkin, Justin Brown, and Shevanise Givans discussed the logistics and roles for the Athena demo scheduled for tomorrow, aiming to understand Athena's workflows for potential implementation in their private practice. The team, including Daniel Callaghan, agreed on adopting the HL7 FHIR standard and open HIE architecture for the "system of systems" platform in Jamaica to facilitate clinical data modeling and system integration. Shevanise Givans provided updates on the application development, demonstrating features like the integrated Google calendar, dark mode, patient tab modifications, navigation with AI recording for notes, and the dragging component for medication ordering, which prompted Ilya Rabkin's feedback on simplifying refills for doctors. The team also addressed connectivity issues for the upcoming mission, with Daniel Callaghan guaranteeing full, fast connectivity, and discussed HIPAA compliance and data security, with Daniel Callaghan suggesting a strategy of "close loop testing" to avoid delays.

### Details

*Notes Length: Long*

* **Athena Demo Scheduled and Roles Defined**: Ilya Rabkin has a demo scheduled with Athena for tomorrow at 2:00 PM and has forwarded the Microsoft Teams meeting link to Justin Brown. Ilya Rabkin asked Justin Brown to forward the link to Shevanise Givans, and Justin Brown confirmed that they would ([00:00:00](#00:00:00)). Ilya Rabkin is approaching Athena about getting a new Electronic Medical Record (EMR) for their private medical practice, as they couldn't be fully honest about the international and non-profit nature of the project. The participants have defined roles for the demo: Justin Brown is the operations team member with an IT background, and Shevanise Givans is the office manager, with the understanding that they need to ensure they are on the same page and ask relevant operational questions. The goal of the demo is to learn about Athena's workflows and what other systems look like, by having Ilya Rabkin give a breakdown of what they are looking for and paralleling it to the actual project's needs ([00:03:09](#00:03:09)).

* **Database Standardization and Architecture Discussion**: Ilya Rabkin inquired if Dennis had shared any information regarding database standardization, potentially related to encryption in transit and at rest. Ilya Rabkin mentioned sharing a document with Dennis about three top standardized methods used, mostly in the US, for data collection, referring to standardized protocols. Justin Brown did not recently receive this document but recalled similar information from the project debrief ([00:04:24](#00:04:24)). Ilya Rabkin clarified the standards they were referring to are HL7 FHIR and open HIE. Ilya Rabkin explained that they are tasked with building a "system of systems" platform for Jamaica, encompassing telehealth, home visits, national surveillance, and AI integration ([00:05:33](#00:05:33)). Instead of designing a custom database schema, Ilya Rabkin proposed adopting the HL7 FHIR standard as the internal data model and the open HIE architecture for system design. This approach avoids "reinventing the wheel" on clinical data modeling, facilitates sharing capability with labs and pharmacies, and positions the platform for native AI integration. These predefined standards make integration with other countries and platforms easier. Ilya Rabkin mentioned that Dennis thinks this would not be hard to implement because the project is not yet too far along. Justin Brown acknowledged that there is not much to pivot from, so they would just be moving in that direction ([00:07:19](#00:07:19)). Ilya Rabkin noted that they had asked Gemini about open-source standard data dictionaries based on a partner's inquiry and suggested Justin Brown research this or consult Dennis ([00:08:35](#00:08:35)).

* **Application Development Update \- Dark Mode, Calendar, and Patient Tab**: Shevanise Givans presented updates to the application interface, which is currently in dark mode, noting that it is the same concept as before. They integrated a Google calendar feature, which allows the user to click to redirect to Google, select an account, and integrate appointments into the application, where they will appear on the application calendar alongside important updates. The headings in the application were changed as requested. On the patient tab, excess elements at the top were removed. Users can click to open a video call, and the layout within the call has been modified ([00:10:07](#00:10:07)).

* **Application Development Update \- Navigation and AI Integration**: Shevanise Givans demonstrated the sidebars used to navigate different categories within the patient interface. For the notes section, users can click in, use AI recording, which sets up the notes, and then sign the notes to indicate completion. The medication history feature allows users to view past medications and add new ones. A dragging component was added where recommended medications populate based on the patient's condition, or users can search for medications and drag them in ([00:11:03](#00:11:03)). Ilya Rabkin commented that the dragging component is cool but suggested that if a patient like Jane Doe is refilling a medication, the current medications should be on the sidebar and easily drag-and-drop refilled, which Shevanise Givans understood and suggested adding a separate tab for past medications for dragging ([00:12:03](#00:12:03)). Ilya Rabkin emphasized the need to keep it simple for a "super lazy" doctor who does not want to think, ensuring that previous settings for dose and other details are readily available ([00:13:03](#00:13:03)).

* **Application Development Update \- Visit History and Scheduling**: Shevanise Givans showed the visit history tab, which provides a quick overview, and users can click into it for more detail. The design of the overview with white coloring will be changed. The critical information is viewable, and there are links to medications ([00:13:03](#00:13:03)). The calendar view allows users to click the time for scheduling. The patient can be searched by ID, name, or email, allowing for variety in search methods. When setting an appointment, users can set the type and location. Ilya Rabkin and Justin Brown discussed whether location should be mandatory. Ilya Rabkin stated that the system needs to be ready for clinics and field use, such as a patient's home, suggesting that appointment type (e.g., home video visit, home in-person visit, clinic visit) could determine mandatory dropdowns, such as the room number for a clinic visit ([00:14:01](#00:14:01)). Shevanise Givans indicated they would work on integrating this clarification ([00:14:51](#00:14:51)).

* **Application Development Update \- Orders and Feedback Request**: Shevanise Givans also showed the orders section, where users can add orders and specify the reason, with options to add the person. Shevanise Givans stated that a link to the current state of the application will be sent for review. Shevanise Givans requested feedback from Ilya Rabkin about what Ilya Rabkin and the doctors would particularly want for each tab to ensure appropriate additions or removals, as the current design is based on research and their own checks ([00:16:11](#00:16:11)). Ilya Rabkin agreed to provide the feedback in the same way as last time, by recording themselves while exploring the application and then compiling the feedback ([00:17:04](#00:17:04)).

* **Athena Demo Purpose and Dark Mode Preference**: Ilya Rabkin emphasized that the Athena demo's purpose is to gather ideas, not to completely copy them, but to borrow best practices and cool ideas to ensure their system is better. Ilya Rabkin expressed a personal preference for the dark mode, noting that others would need to comment on it as well ([00:17:55](#00:17:55)). Shevanise Givans commented that dark mode is generally better for the eyes ([00:18:56](#00:18:56)).

* **Functionality Testing and Link Delivery**: Ilya Rabkin asked if they could play around with the demo patients to order medications, labs, and imaging. Shevanise Givans clarified that the application is not fully flushed and connected yet but will work on it and send the link either this evening or early tomorrow ([00:18:56](#00:18:56)).

* **Connectivity for the Next Mission and Offline Sync**: Ilya Rabkin brought up the issue of connectivity for the next mission, tentatively scheduled for January 15th, and mentioned talking to Daniel Callaghan about Starlink and mesh networks to ensure the system can be used. Justin Brown noted that some of the system has offline sync capabilities, which prevents data loss by saving information on the device until connectivity is regained and the data can sync with the database. Justin Brown also mentioned that they have not yet implemented the manual override for data clash but that it was next up ([00:19:50](#00:19:50)) ([00:23:01](#00:23:01)). Daniel Callaghan later joined the meeting and guaranteed that the team would have full, fast connectivity for the next mission, regardless of the location ([00:23:01](#00:23:01)). Daniel Callaghan also agreed to figure out the logistics of providing tablets for the doctors or nurses ([00:23:55](#00:23:55)).

* **Voice Recording for Medication Ordering**: Ilya Rabkin suggested integrating voice recording AI for ordering medications, especially since typing on tablets might be difficult. This would allow a user to simply say the medication and dosage (e.g., "Leinipril 20 milligrams"), and the system would search for it. Shevanise Givans confirmed that they are able to integrate this feature to offer both typing and voice options ([00:20:51](#00:20:51)).

* **HIPAA Compliance and Data Security**: Ilya Rabkin inquired about updates on security and HIPAA compliance. Justin Brown stated that the database used is natively HIPAA compliant. Furthermore, the AI services are run on their own servers, so data is not sent to third parties. Ilya Rabkin mentioned the necessity of meeting with the Ministry of Health, who may have specific security requirements for such systems, and that Dennis might have input on this ([00:21:52](#00:21:52)). Daniel Callaghan suggested that data security could be discussed the next day if Nastasia is part of their call ([00:23:55](#00:23:55)). Daniel Callaghan suggested telling the Ministry of Health that they will delete the data for now as a strategy, but ultimately acknowledged that for data retention, a sit-down with the Ministry to sign legislation would be necessary, a point with which Ilya Rabkin agreed. Daniel Callaghan cited a conversation with Dr. ROF, confirming the need for an agreement and for the Ministry to have access, possibly via a portal ([00:24:49](#00:24:49)). Daniel Callaghan suggested maintaining "close loop testing" where they don't keep the data to avoid slowing down progress, in line with an "ask for forgiveness, not for permission" approach ([00:25:32](#00:25:32)).

* **Meeting Cadence Adjustment**: Ilya Rabkin asked if meeting once a week was sufficient. Justin Brown suggested increasing the frequency to twice a week for quick turnaround and resolving possible issues, but noted that they should hold off until after Christmas week. Daniel Callaghan urged the team to work on Christmas and stressed the urgency given the upcoming mission, which he described as "game day" in a few weeks ([00:27:12](#00:27:12)). Ilya Rabkin confirmed that the current progress, particularly if the medication ordering works, is already good and moving ahead of what is strictly needed for the next mission, which will likely use only basic utility ([00:28:08](#00:28:08)). Daniel Callaghan suggested that some future meetings should be actual demos, with someone performing as a doctor and another as a nurse, to go through the full workflow and debug the system ([00:29:09](#00:29:09)).

* **Next Steps and Scheduling**: Ilya Rabkin asked Justin Brown if they had access to a nurse for system review, and Justin Brown suggested asking Dennis. Ilya Rabkin stated they would secure a nurse and add this to their conversation with Daniel Callaghan. The team decided to take the 26th off. The next meeting dates were planned for the 29th and the 2nd, after which they will determine a better cadence ([00:29:09](#00:29:09)). Ilya Rabkin confirmed the following to-dos: Ilya Rabkin owes feedback to Shevanise Givans and will secure a nurse for feedback; Justin Brown will chat with Dennis about the database dictionary. Ilya Rabkin reminded Justin Brown and Shevanise Givans to act as operations and office managers for their practice during the demo tomorrow ([00:30:12](#00:30:12)).

### Suggested next steps

- [ ] Daniel Callaghan will make sure there is guaranteed connectivity from Starlink and Mesh networks, and acquire tablets for the next mission around January 15th.  
- [ ] Justin Brown will forward the Microsoft Teams meeting link for the demo with Athena to Shevanise Givans.  
- [ ] Shevanise Givans will (1) add a tab for past medications at the AI recommended portion of the medication ordering for easy dragging for refilling, (2) integrate appointment type to trigger different mandatory dropdowns, and (3) integrate voice recording AI functionality to the medication ordering.  
- [ ] Shevanise Givans will work on fully connecting the demo patients' functionality to allow for ordering medications, labs, and imaging.  
- [ ] Shevanise Givans will send Ilya Rabkin a link to the current platform for review, requesting feedback on specific requirements for each tab.  
- [ ] Ilya Rabkin will go through the application link provided by Shevanise Givans and provide feedback for each tab, and find a nurse to also review the platform and give feedback to Shevanise Givans.  
- [ ] Ilya Rabkin will try to meet with the Ministry of Health to discuss their requirements for system security.  
- [ ] Justin Brown will touch base with Dennis about the database dictionary stuff.  
- [ ] The group will plan to meet on the 29th and the 2nd to establish a better meeting cadence.

*You should review Gemini's notes to make sure they're accurate. [Get tips and learn how Gemini takes notes](https://support.google.com/meet/answer/14754931)*

*Please provide feedback about using Gemini to take notes in a [short survey.](https://google.qualtrics.com/jfe/form/SV_9vK3UZEaIQKKE7A?confid=vRdMvNzOsQsC1nFOjxILDxIQOAIIigIgABgBCA&detailid=detailed)*

# 📖 Transcript

Dec 22, 2025

## ICF Telehealth Platform \- Transcript

### 00:00:00 {#00:00:00}

   
**Ilya Rabkin:** Hello.  
**Shevanise Givans:** Good  
**Ilya Rabkin:** Good afternoon.  
**Shevanise Givans:** afternoon.  
**Ilya Rabkin:** All right. Hey, Justin. How are you doing?  
**Justin Brown:** I'm doing good  
**Ilya Rabkin:** Not too bad.  
**Justin Brown:** here.  
**Ilya Rabkin:** Not too bad. Is it just us three today?  
**Justin Brown:** I think so. I think so. Um, if anything, I'll just give them an update, but we can just continue.  
**Ilya Rabkin:** Okay, great. Great. Um, so I guess um let me just I know we spoke a little bit um earlier, so I'll just update Shiovinise about it. So um I have a demo with Athena scheduled tomorrow at 2\. Um, I sent Justin I forwarded him the link to that meeting. I don't know, Chevise if you wanted to join. Um, depending on if you think it'll be helpful or depending on your schedule, but we probably need at least two people. We don't need a ton more.  
**Shevanise Givans:** Okay, no problem. Um, what time would it be?  
**Ilya Rabkin:** It's at two.  
**Shevanise Givans:** Okay, that works.  
   
 

### 00:03:09 {#00:03:09}

   
**Ilya Rabkin:** Justin, can you forward her the it's a Teams meeting, Microsoft Teams meeting link?  
**Justin Brown:** Yeah, no problem.  
**Ilya Rabkin:** Awesome. So, the way So, this what we're doing is really we're we're telling Athena that I'm looking at um uh getting a new EMR for my private medical practice. Be the I tried kind of being a little bit more honest with what we're doing, but because it's international, they don't they can't do that even for nonprofit organizations. So essentially I'm telling them I'm looking for a new medical record system for my practice. I'm expanding etc. And you guys uh work with me as my operations team. Justin has some IT background. Jice, you're kind of maybe like my office manager, something like that. So, we just have to make sure we're all on the same page and just asking questions that you guys think would be relevant um for the operations. And I'll kind of give them a breakdown of what I'm looking for from Athena and kind of make it parallel what we need as much as possible so they can show us um their workflows and just so we could learn what other systems look like.  
   
 

### 00:04:24 {#00:04:24}

   
**Justin Brown:** Okay.  
**Ilya Rabkin:** Okay, you guys cool with that?  
**Justin Brown:** Yeah.  
**Shevanise Givans:** Oh  
**Justin Brown:** Yeah.  
**Ilya Rabkin:** Okay. Um, so that was from my end. And then Justin, did Dennis share with you anything about that whole um the database standardization  
**Justin Brown:** Um,  
**Ilya Rabkin:** thing?  
**Justin Brown:** in terms of encryption, um, in transit and at rest, like that kind of  
**Ilya Rabkin:** Uh,  
**Justin Brown:** thing.  
**Ilya Rabkin:** maybe. So I think I I spoke to him about these um kind of standards in how data is collected. Maybe it had to do with encryption. Um I shared with him a document about like these three top um standardized methods that are used I think mostly in the US. They may be used um internationally as well. But it's the standardized protocol. Does that ring a bell?  
**Justin Brown:** Um, he didn't share that with me recently, but I know that we had some of that information in the project debrief. Um, so I'm not sure if those are the same. Um, let me see if I can find some.  
   
 

### 00:05:33 {#00:05:33}

   
**Justin Brown:** Let's see if they correlate with what you have.  
**Ilya Rabkin:** Let's see.  
**Justin Brown:** Like the TLS 1.3  
**Ilya Rabkin:** Maybe like there's like the OM.  
**Justin Brown:** or  
**Ilya Rabkin:** Um,  
**Justin Brown:** the OM  
**Ilya Rabkin:** let's see. Do I Where did I put this? See where did I send this to him? What did I do with it? There's so many documents that are now adding up. So, let's see. Yeah. So I think you meant HL7 FHIR open HIE is  
**Justin Brown:** Oh,  
**Ilya Rabkin:** that does that  
**Justin Brown:** okay. No. Um, I didn't get that. I didn't get that document. Um,  
**Ilya Rabkin:** okay talk to him.  
**Justin Brown:** but  
**Ilya Rabkin:** So I talked to him about it. I um so so as we build so I guess I'll kind of give you a quick summary. Um, so at least I I'll read from to you guys at least what I wrote up as my executive summary. So we're tasked with building a system of systems for Jamaica, a platform uh that must handle everything from teleahalth and home visits to national surveillance AI integration.  
   
 

### 00:07:19 {#00:07:19}

   
**Ilya Rabkin:** So the initial instinct might be to design a custom database schema. So like a data dictionary from scratch. So what I sent was a proposal as an alternative approach. adopting the HL7 FHIR standard as our internal data model and the open HIE architecture as a system design. So it's sort of um by using these open global standards, we're avoiding reinventing the wheel on clinical data modeling and sharing kind of capability with labs and pharmacies and positioning the platform for a native AI integration. So it's it has to do with the architecture of it of these using these predefined standards make um integration with other countries other platforms um easier right so they could talk each other talk to Dennis I think he was doing some research into this I think it would be important for us to  
**Justin Brown:** Okay.  
**Ilya Rabkin:** know um when I spoke to him he thinks because we were not super far along It wouldn't be a a hard thing  
**Justin Brown:** Yeah, there's not much to pivot from.  
**Ilya Rabkin:** to  
**Justin Brown:** So, it's basically just going in that direction  
   
 

### 00:08:35 {#00:08:35}

   
**Ilya Rabkin:** Yeah. So, essentially,  
**Justin Brown:** anyway.  
**Ilya Rabkin:** I just asked um Gemini because I had um one of my good partners, he's um he's in business, but he also has some IT background. So, he asked me what we were using. So there's essentially I asked if there are open- source standard data dictionaries and I just started reading about what's available, what's used. So maybe if um doing a little research on that, but I think Dennis might be able to help you as well.  
**Justin Brown:** Okay. All right.  
**Ilya Rabkin:** Um so those are really the two things.  
**Justin Brown:** Understood.  
**Ilya Rabkin:** Yeah, ask them about that. From your guys end, how are we with further development? Um any new updates on how we're doing with the  
**Shevanise Givans:** Uh yes, I'm going to present my screen. Give me a second,  
**Ilya Rabkin:** platform  
**Shevanise Givans:** please. Share your screen. One second. Are you guys seeing my screen?  
**Ilya Rabkin:** Okay. Yeah, I'm seeing  
**Shevanise Givans:** All right.  
**Ilya Rabkin:** it.  
   
 

### 00:10:07 {#00:10:07}

   
**Shevanise Givans:** So, it's currently in the dark mode. That's why it looks different,  
**Ilya Rabkin:** That's cool.  
**Shevanise Givans:** but it's the same concept.  
**Ilya Rabkin:** Yeah.  
**Shevanise Givans:** Um, for the calendar, I added in the Google calendar. So, you're able to click um it will redirect you to Google and you're able to select whichever account you like to use. And this integrates into the application. So, I don't want to connect it now, but yeah, that's there. And once you have your um appointments in,  
**Ilya Rabkin:** Yeah.  
**Shevanise Givans:** it's going to appear here as you know, and the important updates. So, that's that. You had mentioned changing the edings for right here, which had been done. Um so, I'm going to go through the different tabs real quick.  
**Ilya Rabkin:** Mhm.  
**Shevanise Givans:** So, for the patient tab, I removed the up like the excess at the top. Um, you're able to click this and open up the video call. Once you're in, I changed the layout in a sense. It has what we had last time, but a little bit of change.  
   
 

### 00:11:03 {#00:11:03}

   
**Shevanise Givans:** So, this would be the sidebars that you use to navigate the different um categories. Uh, for example, the notes. You're able to click into the notes. You do your AI recording here and it, you know, sets up your notes here. You add, you know, and do your AI thingy and you're able to sign the notes. So, it shows that, you know, it was signed by somebody. Uh, notification history. So, you're able to click into it. It shows the medication history. And let's say you want to add a medication. It has a like a you mentioned the dragging component where you're able to drag. So based on the patient's um condition it populates the recommended and you're also able to search like that would be how it would look. So you would search in you drag in and so on so forth.  
**Ilya Rabkin:** Oh, I see.  
**Shevanise Givans:** review one  
**Ilya Rabkin:** Yeah, that's cool.  
**Shevanise Givans:** sign.  
**Ilya Rabkin:** What? So, this is this is definitely a cool platform.  
   
 

### 00:12:03 {#00:12:03}

   
**Ilya Rabkin:** What I meant by dragging um is dragging.  
**Shevanise Givans:** Mhm.  
**Ilya Rabkin:** Let's say I'm just refilling a medication. Jane Doe is already using. So I just like it's on the sidebar with all her current medications.  
**Shevanise Givans:** Mhm.  
**Ilya Rabkin:** And if she already has one, I would just drag that in to make it easy. But but this is also I think a good way also good. That way there's a little search. I search which medicines I'm thinking of it recommendations or any alerts, allergies and then I could just drag it in. So that's kind of cool.  
**Shevanise Givans:** Okay. So,  
**Ilya Rabkin:** Okay.  
**Shevanise Givans:** um at the AI recommended portion, so you like a other tab that shows past medication that you could just drag in.  
**Ilya Rabkin:** Yeah. Just to keep it simple, instead of like, you know, yeah,  
**Shevanise Givans:** searching.  
**Ilya Rabkin:** Jane Doe is here and I'm refilling her meds and I had it set up at a certain dose, a certain thing, instead of trying to remember, it's just right there for me.  
   
 

### 00:13:03 {#00:13:03}

   
**Ilya Rabkin:** Right? Imagine the doctor's super lazy,  
**Shevanise Givans:** Okay.  
**Ilya Rabkin:** does not want to think. Let's make it  
**Shevanise Givans:** Okay. I understand that.  
**Ilya Rabkin:** easy.  
**Shevanise Givans:** Uh now we're going to go over to the visit history tab. So, you mentioned you wanted to see the past history. You get a quick overview and you're also able to click into the overview, the design with the white. I'm going to change it back. But this is basically the overview of how it would look. You would have that um the critical information. So, I haven't completed the design. My bad. But this is what this is looking like so far. Uh get to go back. You have the medications. You're able to Click into that. What's happening? Oh, there we go. Medication. You're able to click into that and it goes back to that same page and then you change the person uh the calendar. So now you have a view of the calendar.  
   
 

### 00:14:01 {#00:14:01}

   
**Shevanise Givans:** You have the day like click the time. It shows whatever you want. Then you can search the patient in the system. So let's say um who is in there? Yeah, John is in there. So you get to search and John comes up. You can search by ID or by name or by email. So, you kind of have variety. If you don't remember one, you have another. Um, you click it. You're able to set the type,  
**Ilya Rabkin:** Mhm.  
**Shevanise Givans:** you know, the location. I'm going to make these mandatory. I think location should be mandatory, right? Should it  
**Ilya Rabkin:** Uh, good question.  
**Shevanise Givans:** be?  
**Ilya Rabkin:** Um,  
**Justin Brown:** Aren't these done over um video conference?  
**Ilya Rabkin:** some will, some won't. So, we have to this has to be ready for an a an an idea of clinics using it and field. So, if the patient's at home, we could just put home home like we could write home or an additional node virtual  
   
 

### 00:14:51 {#00:14:51}

   
**Shevanise Givans:** Huh?  
**Ilya Rabkin:** visit. Or another option is a when we do a new appointment, we could do appointment type. So it could be home video visit, home in-person visit, clinic visit, and that could then create a different set of dropdowns that you  
**Shevanise Givans:** That's  
**Ilya Rabkin:** that we may find mandatory to put in. So like if it's if let's say we have a doctor in one of the public health s public health clinics seeing patients using this system they may say you know this is a clinic visit and they'll the nurse would put the  
**Shevanise Givans:** Please.  
**Ilya Rabkin:** room but if if someone's scheduling this or setting this up for Justin who's going to be at home the appointment type will just be a home virtual visit versus a home in person. Something like that. We'd have to maybe word those things better. But that's sort of what I mean.  
**Shevanise Givans:** Okay, that brings a little clarity to that. So, I'll be, you know, working on integrating that there, which shouldn't be like a problem.  
**Ilya Rabkin:** Yeah.  
   
 

### 00:16:11 {#00:16:11}

   
**Ilya Rabkin:** Yeah. This is  
**Shevanise Givans:** Uh, oh, good.  
**Ilya Rabkin:** cool.  
**Shevanise Givans:** Let me see what else is there. Yes. So, this is for the orders. Um, so yeah, the different orders, you know, you able to add your orders, why you want the order, and there will be options to add the person. So, with what I currently have, I'm going to be sending you a link for you to go through. However, I will also require hope I'm not asking for too much over the holiday, but um for each tab, I would like you to tell me exactly what you guys would like because this is based on like a little bit of research um and my own checks, but I don't know what you or the doctors would particularly want.  
**Ilya Rabkin:** Mhm.  
**Shevanise Givans:** So, I probably be adding in things that shouldn't be there. So, I would like to have you go through possibly, not exactly right now, but going through so I can know what I can add, remove, so on so forth.  
**Ilya Rabkin:** Yeah.  
   
 

### 00:17:04 {#00:17:04}

   
**Ilya Rabkin:** Like Okay. Like I did for last time.  
**Shevanise Givans:** Yes.  
**Ilya Rabkin:** Yeah.  
**Shevanise Givans:** Yes.  
**Ilya Rabkin:** Okay.  
**Shevanise Givans:** Yes.  
**Ilya Rabkin:** Um, yeah, and I'll do that. So, I'll wait. So,  
**Shevanise Givans:** So,  
**Ilya Rabkin:** I'll wait till I have it and I'll explore and I'll essentially what I did last time is as I'm looking through it, I'm just recording myself talking to myself and then I put it into a  
**Shevanise Givans:** right.  
**Ilya Rabkin:** something  
**Shevanise Givans:** Okay. Yeah.  
**Ilya Rabkin:** normal.  
**Shevanise Givans:** So, that's what I would like, please. Uh but yeah, that's currently the updates with the application. Uh yeah, I'm checking to see if there's anything else I didn't mention, but yeah,  
**Ilya Rabkin:** Can you So,  
**Shevanise Givans:** that's it for  
**Ilya Rabkin:** yeah. So, we could we Yeah, let let's wait.  
**Shevanise Givans:** now.  
**Ilya Rabkin:** Um because there was a few things I saw that I um would have feedback on, but we could I could wait to put it all together in one one thing. So, let's we'll wait for that then.  
   
 

### 00:17:55 {#00:17:55}

   
**Ilya Rabkin:** But this is cool. I mean, this is great progress. Um, I think the the Athena demo will give us another maybe just ideas and we don't have and the point of the Athena demo is not to copy them. We we want our own thing that's better, but maybe we're going to see something that's like, oh, you know, that's a cool idea. Let's borrow that.  
**Shevanise Givans:** Okay,  
**Ilya Rabkin:** Okay,  
**Shevanise Givans:** that makes sense.  
**Ilya Rabkin:** just to give you an idea like we're not I don't want to completely emulate Athena, but just take best practices. I think it's always good to take the best ideas from places.  
**Shevanise Givans:** Yeah, right. We're not completely stealing. We're just  
**Ilya Rabkin:** Exactly.  
**Shevanise Givans:** borrowing.  
**Ilya Rabkin:** Exactly. Okay. Um, no, this is great. Um, I like, you know, I kind of like the dark mode. Maybe even better, but I always put everything in dark mode. That may be my own personal preference. So, we'll have we'll need other people to comment.  
   
 

### 00:18:56 {#00:18:56}

   
**Shevanise Givans:** Right. Yeah, that's why I have it in dark mode. It's better for the eyes, I  
**Ilya Rabkin:** Yeah, I usually like Yeah, I like dark mode.  
**Shevanise Givans:** think.  
**Ilya Rabkin:** Um, okay. Yeah, this is great. Can't wait to play around with it. And can you It looks like the demo patients I could actually play around and order medications and order labs and order imaging. It looked like or fake order.  
**Shevanise Givans:** in a sense. So, it's not fully flush like all connected.  
**Ilya Rabkin:** Okay.  
**Shevanise Givans:** So, I'm just going to work on that and then I'll be able to send you the link hopefully this evening or early  
**Ilya Rabkin:** Yeah,  
**Shevanise Givans:** tomorrow.  
**Ilya Rabkin:** that's perfect. And I Yeah, that'll work. Um Okay. Okay, we'll move we'll move from there then. So, this was all this was good.  
**Shevanise Givans:** You're supposed to  
**Ilya Rabkin:** Um anything else you guys wanted to bring up or  
**Shevanise Givans:** be  
**Ilya Rabkin:** ask  
**Justin Brown:** No. Um, nothing from me.  
   
 

### 00:19:50 {#00:19:50}

   
**Ilya Rabkin:** the Oh,  
**Justin Brown:** But did you actually Yeah.  
**Ilya Rabkin:** go ahead.  
**Justin Brown:** Never mind school. Yeah. Not from  
**Ilya Rabkin:** Okay. Um, the two things,  
**Justin Brown:** me.  
**Ilya Rabkin:** one of which maybe would really be for you, uh, the second may not be. So, the one that may not be is for the next mission, we're going to really need to make sure connectivity is good. So that's maybe something I'll talk to Daniel about to make sure we have Starlink and mesh networks because it it's going to be very sad if we can't use this  
**Shevanise Givans:** Are you doing good?  
**Ilya Rabkin:** like we like last time.  
**Justin Brown:** Some of it has offline sync. So it prevents loss. So some of it actually you can put in your information and um it saves it on your device until you regain back connectivity where it syncs it with the database.  
**Shevanise Givans:** All right.  
**Justin Brown:** I haven't done the manual um override in terms of like if there is a clash of data but that that was what was next up  
   
 

### 00:20:51 {#00:20:51}

   
**Ilya Rabkin:** Mhm.  
**Justin Brown:** but when is the next mission again in  
**Ilya Rabkin:** So, yeah,  
**Justin Brown:** January  
**Ilya Rabkin:** the next mission I'm planning, let's say January 15th.  
**Shevanise Givans:** I give you 420\.  
**Justin Brown:** um all right I'll see if I can get it finished before then but yeah the offense sync is  
**Ilya Rabkin:** Okay.  
**Justin Brown:** there  
**Ilya Rabkin:** Okay. Uh, shise and back again. I could leave this for next time, but for if we're going to be using tablets for this, you know, sometimes typing is tough. So, that voice recording AI is good. Is it easy to add that voice recording AI when ordering a medication? So I could just say I could click on the tablet to the med orders and just say Leinipril 20 milligrams and it'll search it for me.  
**Shevanise Givans:** Yeah. Yeah, I think um that we'll be able to Yeah, we're able to integrate  
**Ilya Rabkin:** That's cool.  
**Shevanise Givans:** that.  
**Ilya Rabkin:** So like have both options to type or just to voice ask.  
**Shevanise Givans:** What you would like to have there,  
   
 

### 00:21:52 {#00:21:52}

   
**Ilya Rabkin:** Yeah, that's cool. Okay.  
**Shevanise Givans:** right?  
**Ilya Rabkin:** Um the other question that I was going to ask is in terms of um security on all that HIPPA compliance patient stuff. Um any updates? Do are we aware of what's going on from that standpoint?  
**Justin Brown:** Um I believe that the database that we're using um it is natively HIPPA compliant. So we should be fine in that regard. Um and then all the services in terms of the AI usage are on our  
**Shevanise Givans:** This  
**Justin Brown:** servers.  
**Shevanise Givans:** is  
**Justin Brown:** So it's not it's not sent to any third parties.  
**Ilya Rabkin:** Okay. Okay.  
**Justin Brown:** So we're fine.  
**Ilya Rabkin:** So, well, uh, yeah, ultimate I'm still trying to meet with the Ministry of Health because they may have certain requirements for these kind of systems and I think we'd be able to work with them because they don't really have a big big system yet. um which is what we're building ultimately but I think they may have some ask about security ultimately um so I I'll work on that and see  
   
 

### 00:23:01 {#00:23:01}

   
**Justin Brown:** Okay.  
**Ilya Rabkin:** but Dennis may have some thoughts as well so cool  
**Daniel Callaghan:** at the top.  
**Ilya Rabkin:** so  
**Daniel Callaghan:** Too deep and too low or just too deep. Sorry about that, guys.  
**Ilya Rabkin:** no speak of the devil and he  
**Daniel Callaghan:** My bad. My bad.  
**Ilya Rabkin:** appears good  
**Daniel Callaghan:** Uh yeah. Hey guys, how are you all? I apologize for the  
**Ilya Rabkin:** No, no, no. This is this was fine. We were just chatting.  
**Daniel Callaghan:** absence.  
**Ilya Rabkin:** She was Jonice was showing me this cool model. Um, so I have some homework for her to do. I'll do that. Um, Daniel, so you could actually potentially, we well, I know we're meeting tomorrow, but one of the things we were talking about is making sure for the next mission and let's say January 15th, we have guaranteed connectivity from Starlink and Mesh networks because Chevanise is going to be very sad if we can't use her awesome system and  
**Daniel Callaghan:** Yeah, I will not let the team down.  
   
 

### 00:23:55 {#00:23:55}

   
**Ilya Rabkin:** just  
**Daniel Callaghan:** That was a big risk on my part. And um I realized that um I'll make sure that the team has full connectivity for the next mission. Anywhere we go, internet will be there. It will be super fast and you'll not have any connectivity issues. I'll guarantee it.  
**Ilya Rabkin:** and  
**Daniel Callaghan:** Um,  
**Ilya Rabkin:** tablets.  
**Daniel Callaghan:** yes, I can get tablets for every every doctor maybe or every nurse. I I'll figure it out.  
**Ilya Rabkin:** Yeah,  
**Daniel Callaghan:** Not maybe five.  
**Ilya Rabkin:** we we'll the logistics we could work out at our meeting as we go.  
**Daniel Callaghan:** I'll figure it out. Yes.  
**Ilya Rabkin:** Um, and then I'm I'm setting up after I guess the holidays meeting with  
**Daniel Callaghan:** Yes.  
**Ilya Rabkin:** the Minister of Health to figure out the data security questions and a few other things I need to know. But that that I'll need to get back to the backend development in terms of all that HIPPA compliance that we've discussed.  
**Daniel Callaghan:** That could be actually a conversation we have tomorrow if Nastasia is a part of our call, right?  
   
 

### 00:24:49 {#00:24:49}

   
**Ilya Rabkin:** Yeah,  
**Daniel Callaghan:** Yeah.  
**Ilya Rabkin:** perfect.  
**Daniel Callaghan:** Oh, yeah. Yeah, yeah, yeah, yeah. We definitely need to get the the the back end. I'm pretty sure it's going to be like, you know, making sure the data is encrypted. Again, though, in my opinion, personally, we have to tell we have to tell them that we'll delete the data. That's just our best bet for now. Um, if we're going to if we want to keep the data, we have to have a sit down with the actual ministry. But I'll leave it with you guys for  
**Ilya Rabkin:** Yeah, fair. I mean,  
**Daniel Callaghan:** now.  
**Ilya Rabkin:** ultimately, we're going to want a system where we keep the data, right? One of the benefits to them is us handling that.  
**Daniel Callaghan:** That that will definitely come with us signing legislation with them for sure. Um,  
**Ilya Rabkin:** Bingo.  
**Daniel Callaghan:** after spoking speaking with um Dr. Karen Roof, no it's not Karen. Karen is not her first name, but her last name is ROF.  
   
 

### 00:25:32 {#00:25:32}

   
**Daniel Callaghan:** I was able to know that yes, we have to sign an agreement with them for sure. They have to understand everything. They have to have also they have to have access to it. So that would also mean having a portal for the ministry.  
**Ilya Rabkin:** Yeah.  
**Daniel Callaghan:** So yeah,  
**Ilya Rabkin:** And that's stuff I'm gonna Yeah. I'm slowly working on.  
**Daniel Callaghan:** I just simply put I just don't want to slow down our our progress because of that.  
**Ilya Rabkin:** Yeah. We should.  
**Daniel Callaghan:** So we will say close loop testing um where we don't keep the we don't keep the data.  
**Ilya Rabkin:** Yeah.  
**Daniel Callaghan:** That's what I think we'll tell the public and that that's what we'll do.  
**Ilya Rabkin:** Ask for forgiveness, not for  
**Daniel Callaghan:** You know what I'm saying? So, yeah. But, um,  
**Ilya Rabkin:** permission.  
**Daniel Callaghan:** this looks great. Um, you have Chev on the call and Justin, I see, is on the call as well. If you have these two people on the call, you're good to go.  
   
 

### 00:26:13

   
**Daniel Callaghan:** You have nothing to worry about. They're the best of the best of the best of the best.  
**Ilya Rabkin:** Yeah.  
**Daniel Callaghan:** Ain't that right,  
**Ilya Rabkin:** Yeah.  
**Daniel Callaghan:** Justin? Ain't that right,  
**Ilya Rabkin:** Thank you.  
**Daniel Callaghan:** Chevise? Ain't that right, guys?  
**Justin Brown:** Ain't nothing funny, Daniel.  
**Ilya Rabkin:** Oh, all right. So, we have a good plan. Um, Justin, yeah, touch base with Dennis about that uh data dictionary stuff. See what he thinks. That actually ultimately may be a convo with Ed. Um, Ed, I guess that might also be in Ed's expertise wheelhouse, but Dennis would know. Oh, hello, sir.  
**Daniel Callaghan:** Hey, how are you?  
**Ilya Rabkin:** Good. Good. Let me turn this  
**Daniel Callaghan:** Ilia is Ilia and the team are here.  
**Ilya Rabkin:** on.  
**Daniel Callaghan:** We're meeting for tele medicine. Oh, I'm sorry. Yeah. Yeah.  
**Ilya Rabkin:** All right. Understood. He's aware. We me and him have chatted. All right.  
   
 

### 00:27:12 {#00:27:12}

   
**Ilya Rabkin:** Cool. Um, so guys, yeah, uh, Chevise, I'll wait for your homework. So, I'll make sure I get get an A+ on that for you. Um, and you'll have it back ASAP. Um, and then do at this stage is once a week still enough or should we be meeting a little bit more frequently.  
**Justin Brown:** Um, we can increase it to twice a week. Yeah.  
**Ilya Rabkin:** Only if you think it's helpful.  
**Justin Brown:** Not I do think so.  
**Ilya Rabkin:** I don't I I dislike useless meetings.  
**Justin Brown:** I do. Yeah. I don't like the meetings thing either, but for quick turn around um and quick um quick resolving of possible issues, I think we should do twice a week. Not this week. It's Christmas week, but you know,  
**Ilya Rabkin:** Okay.  
**Justin Brown:** maybe maybe follow him.  
**Daniel Callaghan:** Listen, what are you talking about? We all We're all working on Christmas. What are you all saying? We're all working on  
**Ilya Rabkin:** No, no,  
**Justin Brown:** That's cool French,  
   
 

### 00:28:08 {#00:28:08}

   
**Daniel Callaghan:** Christmas.  
**Ilya Rabkin:** s I I hope Santa gives you a day off.  
**Justin Brown:** bro. That's cool French.  
**Ilya Rabkin:** No. So, okay. Why don't because next week's also um so okay let's start twice a week next week unless you guys want to meet on the  
**Daniel Callaghan:** I mean I mean we could meet I don't again team let me know if I'm pushing it here.  
**Ilya Rabkin:** 26th  
**Daniel Callaghan:** I just want us to have something ready right? Um simply because we have one two maybe three weeks before it's it's game day. Isn't that right,  
**Ilya Rabkin:** said Yeah, practice game day. Let's I think what we have now is really good.  
**Daniel Callaghan:** Ilia?  
**Ilya Rabkin:** We need to verify just nursing workflow, but this is the current capability if the medication, all that stuff works is more than what we'll need for the next mission.  
**Daniel Callaghan:** Okay,  
**Ilya Rabkin:** We're already we're already moving a little bit ahead,  
**Daniel Callaghan:** this is what I've seen.  
**Ilya Rabkin:** which is the right way to do it. Um,  
**Daniel Callaghan:** Mhm.  
   
 

### 00:29:09 {#00:29:09}

   
**Ilya Rabkin:** the next mission will still likely be very basic utility of this, but it'll be nice to  
**Daniel Callaghan:** I think personally personally I'd love if next  
**Ilya Rabkin:** showcase  
**Daniel Callaghan:** mission we had this we had our application more ingrained in our in our entire you know flow. So I would say some of our meetings should be actual demos where we try to actually have somebody perform as a doctor and somebody perform as a nurse and go through the full workflow and Ilia is there you know maybe an actual nurse is there and we try to debug this as much as possible because the way in which we even did demos before our mission was not the the way that we  
**Ilya Rabkin:** Yeah.  
**Daniel Callaghan:** would be doing it. You need me here?  
**Ilya Rabkin:** Yeah.  
**Daniel Callaghan:** Can we go ma'am?  
**Ilya Rabkin:** See,  
**Daniel Callaghan:** So we need to do demos and then we need to bring the team in and do a demo.  
**Ilya Rabkin:** that's that's a good point. Thanks. Yeah, I see you. Daniel, um Justin, do we have access to a nurse that could also look through this?  
   
 

### 00:30:12 {#00:30:12}

   
**Justin Brown:** Um, not that I'm aware of, but have to ask Dennis about that.  
**Ilya Rabkin:** Okay. Yeah, I'll get I'll get someone. Um I'll add that to my conversation with Daniel tomorrow. So, um All right. Are you you guys are off the 26th?  
**Justin Brown:** Preferably. Uh, prefer  
**Ilya Rabkin:** Yes, sir. No, I'm not I'm not going to piss anyone off. We're off the 26\. Let's then plan again for the 29th and  
**Justin Brown:** All  
**Ilya Rabkin:** then maybe we'll do like a Monday, Thursday, Monday,  
**Justin Brown:** right.  
**Ilya Rabkin:** Friday. So, the next Thursday it's the 1st. So, let's just plan the 29th and the 2nd and then we'll figure out a better cadence.  
**Justin Brown:** Yeah, that works.  
**Shevanise Givans:** Yeah,  
**Ilya Rabkin:** All right,  
**Shevanise Givans:** that's  
**Ilya Rabkin:** perfect. And then All right, Chise, I'll owe you the feedback. I'm going to owe you a nurse to maybe also go through this and give you feedback. Um and then Justin, you'll chat with Dennis about that datab bank um database dictionary thing.  
**Justin Brown:** Christ.  
**Ilya Rabkin:** All right. Did anything else? I just wanted to make sure I kind of we're all on the same page with the  
**Justin Brown:** Yeah,  
**Ilya Rabkin:** to-dos.  
**Justin Brown:** I think I think that's  
**Shevanise Givans:** Yeah, I think that's it. Yeah,  
**Justin Brown:** it.  
**Shevanise Givans:** I agree.  
**Ilya Rabkin:** Awesome. Really cool work. This is going to this is going to be awesome. And then um I'll see you guys both at that meeting at 2 tomorrow. Cool.  
**Justin Brown:** Yeah,  
**Ilya Rabkin:** All right.  
**Justin Brown:** great.  
**Ilya Rabkin:** Thank you. Thank you. Talk soon. Yeah, of course. And remember tomorrow you guys operations and nurse and um office managers for my practice in Novmed.  
   
 

### Transcription ended after 00:34:09

*This editable transcript was computer generated and might contain errors. People can also change the text after it was created.*