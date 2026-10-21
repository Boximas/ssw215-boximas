## Project Recap
Single player browser trivia game for history enthusiasts. The app will pick a random historical figure each round from a set list and will reveal up to 6 written clues. The player will try and guess the figure. The less clues used results in a higher score. 

## Workflow Demo Guide
1. **Open the app:** Open `index.html` directly in Chrome, Firefox, or Edge (no server or install needed). Open DevTools (F12) to the Console tab. The start panel should be visible, all stats should read 0, and there should be no red errors.
2. **Start a round:** Click **Start Game**. The first clue appears, and the progress track shows "Clue 1 of 6" with one dot filled.
3. **Test empty-input validation:** Leave the guess box empty or type only spaces. The **Guess** button stays disabled.
4. **Make a wrong guess:** Type a wrong name (e.g., "Napoleon") and press **Guess**. "Checking…" appears briefly and the controls lock. Then a red chip with your guess appears, a second clue is added, and the progress bar grows. The Console logs the guess and `false`.
5. **Test duplicate guesses:** Submit the same wrong name again. The message "You already guessed that." appears, and no clue is used.
6. **Skip a clue:** Click **Skip to next clue**. A new clue appears without adding a chip.
7. **Lose a round:** Keep skipping until "Clue 6 of 6". The skip button becomes disabled. Submit one more wrong guess. The reveal panel opens with a red border and a score of 0, a history card appears on the right, the Played count goes up, and the Streak resets to 0. The guess box and buttons are now disabled.
8. **Win a round:** Click **New Round**. Read the clues and guess the figure. Surnames work, so "Caesar", "Curie", "Lincoln", "Darwin", or "Lovelace" are accepted, as is "Cleopatra". The reveal panel opens with a green border and a score of 7 minus the clues used. A green history card is added, and the Correct count and Streak increase.
9. **Check for repeats:** Keep clicking **New Round**. None of the 6 figures repeats until all have been played.
10. **Test the mobile layout:** Shrink the window below 768px wide, or use DevTools device mode. The history panel moves below the game in a single column, and the guess box and button stack vertically.


##AI usage log & Reflection
I used AI tools in much the same way that was demonstrated in class. I started by developing a detailed specification description (SPEC.md), giving it to copilot to build based on after doing so. The goal of such a document is to prevent hallucination, and due to this, I had little to no issue in dealing with such. After the creation of the files, I went through the checklist, making sure everything matched specification. Seeing no issue related to the checklist, I made extra sure and read through the code, where everything seemed to be in order. The SPEC.md file is still contained within the project folder, with a simple prompt telling Copilot what to do with it reading "follow and create the documents according to the attatched specifications." 
