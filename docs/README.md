# Golf One & Done - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
    

2. [User Flow](#user-flow)
   
3. [Component Specifications](#component-specifications)
4. [Data Management](#data-management)
5. [UI/UX Guidelines](#uiux-guidelines)
6. [Technical Requirements](#technical-requirements)

## Project Overview
The project is to create a Golf One and Done platform where a user selects a golfer every week competing in a tournament (e.g. the Masters Tournament). A user will earn as much money as his golfer earns in a given tournament (not real money of course). The game will run over 20 weeks and the user who has collected the most earnings over these 20 weeks wins the game. The catch is that a Golfer can be selected only once. The key to success is to chose your golfers wisely as different tournaments offer different purses (so you want to chose the best golfers for the highest paying tournaments given that you cant use the same golfer twice). The aim is to have 20 unique users who can register remotely from any location really(the target though are users based in the UK).

## User Flow
User will register an email, password and username and will then login with either email/username and provide the corresponding password to get in. Once the user is in the main page he can select a golfer (in the GolferTable component for the specific week) and then confirm/save the selected golfer in the first tournament selection box in the Schedule component. The user can also enter Golfers into the other Tournament selection boxes if he/she wants to plan ahead. Once a tournament starts (usually Thursday morning ET/afternoon UK time), the Golfer Table as well as the first Tournament selection box should get locked, meaning that no entries can be made anymore in the first tournament selection box and the selected Golfer should move into the ScoreTracker for the specific tournament and be saved there. Once the current tournament finishes (usually Sunday afternoon ET time/Sunday evening UK time), the new tournament should appear in the GolferTable component and the same tournament should also appear as the first tournament selection box in the Schedule component (essentially moving up one spot). Both of these components should be unlocked as a result. The same process will be repeated for 20 weeks. Another component I plan to add is a weekly poll where the users can answer to the poll. I plan to start the poll on Monday morning UK time and lock the poll once the new tournament starts (and then publish the poll results which will be on display until the new poll is started). All the poll results will be saved in a separate file/table. All the other components (ScoreTracker, Snapshot, GolferRankings) can not be changed by the user and are there really for him/her to track their progress and help them in making the right selections.


### Registration/Login
[Describe the registration and login process]
LoginPage: I want this to be the default starting page. The input fields will be Email/Username (both can be accepted) and Password.  Below that will be a link to go to the Registration page (which a new user can click on who hasnt registered yet). The input fields here will be Email, Password and Username. Below the Username the user will also be given the option to select between a list of preselected images that a user can save as his Profile image. 
At the bottom of the Login page there will also be a "Forgot Password" link where a user can restore his password and then also a checkbox which the client can click on in order to receive an email notification 24 hours before an event locks. The Forgot Password and Email Notification option should also be in the Profile page/link. 

### Navigation
I want to create a navigation bar at the top that is locked (with links going from left to right). I also want to add a logo on the far left of the navigation pane. I want each link to open a new part of the page where the user has the option to either scroll down the webpage or click on a link in the navigation bar to get to that part of the page. I want the links that go from left to right to follow the order top to bottom on the webpage. So e.g. if the first link going from the left is Snapshot/Component I want that to appear on top of the page(and cover the full page). If the Contact is the last link on the navigation page (far right), I want that part to be at the bottom of the webpage. As I said I want each link to cover the full screen (bar the navigation pane which is locked at the top and always visible). The navigation links I envisage are from left to right: Snapshot/Poll, Leaderboard/ScoreTracker, This Week's Event, Strategy Sheet, All the Raw Data, Poll Results, Rules/FAQs, Mission, Profile and Contact. 

### User Interactions
See user flow above. There wont be any interactions between different users on the platform. The users can track their selections in the ScoreTracker and how they stand in relation to other users in the Leaderboard and Snapshot components respectively. The All the Raw Data component should display all the users selections (esentially combine all the ScoreTracker data). The GolferRankings table should help users make the best possible decisions by looking at Golfer's Rankings, check quickly whether a Golfer has already been used (a golfer that has already been used should appear grey), be able to filter Golfers based on different criteria and to search for golfers quickly. The availability column should recalculate each week for how many users a specific golfer is still available. So for example if a specific golfer in Week1 has been selected by 50% of the users (15 out of 30 users), his availability should show as 50%. If the following week, another 10 users select that golfer, his availability should show as 17% (1-(15+10)/30). The availability column as a result should show the same figure to every user. The grayed out golfer displayed should be unique to each user (depending on whether a specific user has previously selected that golfer or not in a past tournament). 

## Component Specifications
### Header/Navigation
See Navigation header above.

### Profile Management
[Describe the profile component and its features]
Very simple. In the Profile section a user can see his Email (not change it), Username (can change/edit it) and can change his profile picture too (from a range of preselected images). There should also be a "forgot password" link as well as email notification checkbox which the user can click on to receive an email notification 24hours before a tournament locks.

### Tournament Selection
[Describe the tournament selection process and rules]
The Tournament selection process will be part of the "This Week's Event" link/page and will be part of the Schedule component (next to the GolferTable). Each tournament will be part of a box and will have a selection box embedded inside where a golfer can be chosen for a specific tournament. Each time a golfer is selected pre lock, the entry is saved in the tournament_selection table in pgAdmin4, showing the id, event, selection, selection_date(timestamp) and is_locked (which is set to false initially). Once a tournament is locked, the status for that tournament should be change to true, meaning that the selected golfer is moved to the score_tracker table. The first tournament selection box is linked to the GolferTable and when a golfer is selected in the GolferTable, that golfer should appear in the first tournament selection box where he can be confirmed and saved. In all the other tournament selection boxes below, golfers can be entered manually. The Schedule component data (tournament_selection) is taken from the schedule.xlsx file and has the following columns: StartDate (prepopulated), Event(prepopulated), Purse (prepopulated) and Selection (input field which will be unique for each user).  So in other words the StartDate, Event and Purse will be the same for each user, however the selections made in the tournament_selection boxes will be unique for each user.

### Leaderboard
The Leaderboard component will be part of the "Leaderboard/ScoreTracker" page and it will allow a user to see where he stands in comparison to the competition. The Leaderboard component should be the same for every user. The Leaderboard component will show a table with the following columns: Rank, Player (showing the Username), Earnings, Winners and Top 10s. The Rank will be sorted/based on which user has the highest earnings (from top to bottom). The Winners column will look at each user's Score_tracker and add up all the Result=1 for a specific user. The Top 10s will look at all the Result <= 10 from the Score_tracker for a specific user and all them all up. So if a specific user has hit 2 winners (two golfers had Result=1 in the Score_tracker), the Winners column for that specific user will display 2. If at the same time, the user had 4 golfers with a Result<=10 in the Score_tracker, the Top10s column in the Leaderboard table should display 4. While the Rank will be based on earnings, I also want to add a sort function above the table that allows the user to sort by Winners and Top10s as well.  

### Score Tracking
The ScoreTracker component will be a part of the "Leaderboard/ScoreTracker" page. The Score Tracker will enable each user to track his selections and see how they performed. The table will have the following columns: event, selection, result and earnings. The events will be prepopulated from the start (taken from the schedule.xlsx sheet) and should match the events from the Schedule component (tournament_selection table). Once a tournament gets locked, the golfer that has been selected in the first tournament_selection box should move into the Score_tracker selection column for that specific event(the first available row). I have created a spreadsheet called WeeklyResult.xlsx which I will update every Sunday evening when the earnings and result are published for the weekend. The selection in the score_tracker should match the values for that golfer in the WeeklyResult.xlsx file and populate the Result and Earnings column for that golfer. The Result can be a numeric value (e.g. 2) or a mix between a numeric and letter value e.g. T8. The Earnings should be a dollar value with commas and 0 decimal places (e.g. $125,000). If a golfer that has been selected that week can not be found in the WeeklyResult.xlsx it means that the golfer has missed the cut (which means that his earnings should be $0 and his result set as "MC" meaning Missed Cut.) The score_tracking should be unique for each user (besides the events list which is the same for all users). 

### Snapshot
This will be at the top left of the first page "Snapshot/Poll" and next to the Weekly Poll. It will be unique for each user showing his/her username as the title and below that a summary showing his/her current ranking(taken from the Leaderboard table for that specific user), earnings (cummulative earning to date which are taken from the Score_tracker Total Earnings row), Winners and Top10s (copying the data from the Leaderboard for that specific user). 

### GolferRankings

This is a table that will be situated in the "This Week's Event" page/link on the left of the page. It will show the Top 200 Golfers (the list is a static list taken from the GolfRankings.xlsx file). The columns are OWGR, Player, Country, Tour and Availability. The OWGR, Player, Country and Tour are static fields(will not change) while the Availability column will change each week. The Availability % will start at 100% for each player and will gradually reduce based on selections made by all users. So for example if a specific golfer in Week1 has been selected by 50% of the users (15 out of 30 users), his availability should show as 50%. If the following week, another 10 users select that golfer, his availability should show as 17% (1-(15+10)/30). The availability column as a result should show the same figure to every user (as it is taken from the data pool off all users). The OWGR, Player, Country, Tour and Availability will be the same for each user. There will also be a search and filter function. Once a golfer has been selected and moved to the Score_tracker, that golfers name and the row should be greyed out (and saved as such). This will be specific to the user's selection. 

### GolferTable
The GolferTable component which will be part of the "This Week's Event" page/link. It will be nested between the GolferRakings(on the left) and the Schedule component (on the right). It is the component that shows me the current week's event and course including start date and start time and below that the Tournament Field. Each week I am extracting data from the DataGolfAPI which shows me the EventName and the CourseName. Below that I will manually input the Start Date, StartTime. The time till lock will automatically be calculated based on these parameters. Finally the Tournament Field list below including the Player, Country, DK Salary and FD Salary is all extracted from the Data Golf API and added once the data is available (usually Monday morning). I have added an additional empty column at the end with checkboxes where a user can select a golfer (that golfer is then displayed in the first Tournament selection box).


## Data Management
### User Data
So in addition to the email adress, the password (which should be hashed and kept very securely), the username and selected image, we should be able to store the user's golfer selections made in the Schedule component (tournament_selection table) as well as the corresponding selections in the score_tracker. The other data point provided would be the weekly poll selections. The database used is Postgres(pgAdmin4). I would need your expertise to see how best to manage/save this data so that each user has unique access to the golfer's selected in the tournament_selection boxes(Schedule component) and where each tournament selection is then uniquely saved for that user in both the tournament_selection table and the score_tracker.

### Tournament Data 
This is esentially the GolferTable component which will be part of the "This Week's Event" page/link. It will be nested between the GolferRakings(on the left) and the Schedule component (on the right). Each week I am extracting data from the DataGolfAPI which shows me the EventName and the CourseName. Below that I will manually input the Start Date, StartTime. The time till lock will automatically be calculated based on these parameters. Finally the Tournament Field list below including the Player, Country, DK Salary and FD Salary is all extracted from the Data Golf API and added once the data is available (usually Monday morning). I have added an additional empty column at the end with checkboxes where a user can select a golfer (that golfer is then displayed in the first Tournament selection box).

### Selection Rules
A golfer can only be chosen once. If a golfer has already been selected in the past and a user clicks on that golfer or types his name in one of the tournament selection boxes, an error message should appear preventing him from making that selection. Note that the comparison should always be made only with selections in the score_tracker not the tournament_selection. In other words, a user can select the same golfer in multiple tournament selection boxes provided that golfer is not yet present in the Score_tracker.

### Scoring System
Each week, the earnings for a selected golfer will be added to an earnings total (displayed in the last row of the Score_tracker) and this value will be shown in the Earnings column for that specific user in the Leaderboard table. The user that has the highest earnings at the end of the competition wins. I have created a spreadsheet called WeeklyResult.xlsx which I will update every Sunday evening when the earnings and result are published for the weekend. The selection in the score_tracker should match the values for that golfer in the WeeklyResult.xlsx file and populate the Result and Earnings column for that golfer. 

## UI/UX Guidelines
### Color Scheme
The name of the app will be BlueFish and the logo is a blue fish so I am thinking a light blue/beige colour scheme. But I am not too strict at this stage yet.

### Layout
I would like the navigation page links to guide users to different parts of the webpage. So the users can either scroll down to different parts of the application/website or click on a specific link to access it directly.

### Interaction Patterns
The key is to have a smooth interaction between the different components but especially the GolferTable and Schedule components as well as between the Schedule component (tournament_selections table) and the Score_Tracker.

## Technical Requirements
### Authentication
I am not an expert on Authentication but I want it to be easy but safe as well. I wont be storing any information that is super valuable (at the end of the day it is a game) but at the same time I want to use very safe standards to protect the users and the integrity of the game. If a user has already logged in we can create cookies that store his data so he doesnt have to log in again. If a user has not registered yet, then  

### Data Persistence
This is where I will really need your advice. I believe that each user should have his/her own database with his her tournament_selection and score_tracker entries where each users selections will be tracked. 

### API Endpoints
1 API endpoint from DataGolfAPI. https://feeds.datagolf.com/field-updates?tour=pga&file_format=json&key=${apiKey}
The API endpoint is used to populate the event and course in the GolferTable component as well as the Tournament Field in the GolferTable component below(the fields populated are Player, Country, DK Salary and FD Salary). The data will be extracted only once a week when the outputs change to show data for the new tournament.

### Performance
I dont think it is too data and compute intensive as I only need to refresh data once a week (not doing live scoreboards or anything of that nature). The biggest challneg might be to track,monitor and save data for up to 30 users. 

---
*Note: This is a living document. Please update it as requirements evolve.* 