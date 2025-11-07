// Tiny, local mock to simulate a supportive AI.
export async function getAiReply(userText: string): Promise<string> {
    const lower = userText.toLowerCase();
    if (lower.includes("anxious") || lower.includes("panic")) {
    return "I'm here with you. Try a slow breath in for 4 seconds, pause for 4, out for 6. What's one small thing you can control right now?";
    }
    if (lower.includes("angry") || lower.includes("mad")) {
    return "Anger is a signal. Can we name what boundary felt crossed? Labeling it often helps reduce its intensity.";
    }
    if (lower.includes("sleep")) {
    return "Sleep can be tough when stressed. Want to try a quick body scan—relaxing each muscle group from toes to head?";
    }
    return "Thanks for sharing that. Would it help to jot the stressor in your tags and rate how you're feeling 1–10? I'm here to listen.";
    }