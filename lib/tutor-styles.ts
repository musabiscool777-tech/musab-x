export const tutorStyles=['Guide me','Use an analogy','Quiz me'] as const;
export type TutorStyle=typeof tutorStyles[number];
export const tutorInstructions:Record<TutorStyle,string>={
 'Guide me':'Coach the student through one manageable step at a time. When helpful, use a vivid everyday example.',
 'Use an analogy':'Use one memorable, concrete analogy. Show exactly how it maps to the concept and where the comparison stops working.',
 'Quiz me':'Ask one short practice question about the topic, then wait for the student to try it. On follow-ups, respond to their attempt with feedback before the next question.'
};
