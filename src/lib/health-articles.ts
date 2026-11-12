import type { HealthArticle } from './types';

export const HEALTH_ARTICLES: HealthArticle[] = [
  {
    id: 'preventive-checkups-guide',
    title: 'Understanding Preventive Health Checkups by Age Group',
    category: 'Preventive',
    icon: '🩺',
    readTime: '4 min read',
    summary: 'Why waiting for symptoms is risky: recommended annual screenings from your 20s through senior years.',
    body: `Preventive healthcare is one of the most effective ways to ensure long-term health and vitality. Rather than waiting for illness or alarming symptoms to develop, routine screenings identify early risk markers such as elevated blood sugar, silent hypertension, or cholesterol buildup before irreversible complications occur.

In your 20s and 30s:
Focus on baseline metrics. Have your blood pressure measured at least once annually. Undergo fasting lipid profile checks every 2–3 years, and ensure tetanus and hepatitis vaccinations are up to date. For women, cervical cancer screening (Pap smear) is recommended every 3 years.

In your 40s and 50s:
Risk profiles accelerate during this period. Annual blood glucose (HbA1c) and lipid checks become essential. Men should discuss prostate screening with their physician, and women should schedule screening mammograms every 1–2 years. Eye pressure checks for glaucoma and cardiac stress testing (TMT/ECG) should be reviewed.

Seniors (60+):
Bone mineral density (DEXA) scans for osteoporosis, annual hearing and vision exams, colorectal cancer screenings, and pneumococcal / shingles vaccinations are strongly advised. Staying proactive protects both personal longevity and family peace of mind.`,
    tags: ['Annual Checkup', 'Screenings', 'Wellness'],
  },
  {
    id: 'managing-diabetes-diet',
    title: 'Managing Diabetes with Smart South Asian Diets',
    category: 'Diabetes',
    icon: '🍎',
    readTime: '5 min read',
    summary: 'Simple meal adjustments, portion rules, and low-glycemic swaps for traditional rice and roti diets.',
    body: `Type 2 diabetes has reached epidemic proportions across India and coastal Karnataka. Traditional diets rich in white polished rice, refined flour (maida), and sweetened beverages can cause rapid post-meal glucose spikes. Fortunately, managing blood sugar does not mean giving up home-cooked meals.

1. Master the Plate Method:
Fill half your plate with non-starchy, fiber-rich vegetables (such as spinach, methi, cabbage, cucumber, and gourds). Dedicate one quarter of the plate to lean protein like lentils (dal), chickpeas, paneer, eggs, or grilled fish. Limit carbohydrate sources—such as brown rice, red matta rice, or whole wheat roti—to the remaining single quarter.

2. Beware of Hidden Sugars:
Tea, coffee, packaged fruit juices, and sweets consume the majority of daily sugar limits. Switch to black tea, cinnamon-infused warm water, or unsweetened buttermilk (chaas).

3. Post-Meal Physical Movement:
Even a brief 10 to 15 minute brisk walk after lunch and dinner helps skeletal muscles absorb glucose directly from the bloodstream, dramatically flattening postprandial glucose curves.

4. Consistent Monitoring:
Keep a log of fasting glucose and post-prandial levels. Regular tracking empowers both you and your doctor to adjust medications and nutrition effectively.`,
    tags: ['Blood Sugar', 'Diet', 'HbA1c', 'Nutrition'],
  },
  {
    id: 'blood-pressure-silent-killer',
    title: 'Keeping Blood Pressure in Check: The Silent Indicator',
    category: 'BP & Heart',
    icon: '❤️',
    readTime: '4 min read',
    summary: 'Hypertension often exhibits zero warning signs. Learn normal targets, sodium reduction, and lifestyle habits.',
    body: `High blood pressure (hypertension) is widely known as the "silent killer" because millions of individuals carry dangerously elevated readings without experiencing a single symptom like headache or dizziness. Over years, untreated blood pressure damages arterial linings, exponentially raising risks of stroke, heart attack, and kidney failure.

Understanding the Numbers:
- Normal: Under 120/80 mmHg
- Pre-hypertensive: 120–129 / <80 mmHg
- Stage 1 Hypertension: 130–139 / 80–89 mmHg
- Stage 2 Hypertension: 140/90 mmHg or higher

Practical Steps to Lower Pressure:
1. Cut Added Salt: The World Health Organization recommends limiting sodium intake to less than 5 grams (1 level teaspoon) of salt per day across all meals. Avoid commercial pickles, papads, and instant noodle seasonings.
2. Increase Potassium: Fresh bananas, coconut water, tomatoes, and leafy greens naturally balance sodium levels in vascular tissue.
3. Stress Reduction and Sleep: Chronic insomnia and elevated cortisol elevate baseline pulse and blood pressure. Aim for 7 to 8 hours of uninterrupted rest nightly.
4. Take Prescribed Pills Reliably: Never pause BP medication simply because you "feel fine." Medications maintain steady vascular tension throughout the day.`,
    tags: ['Hypertension', 'Cardio', 'Heart Care'],
  },
  {
    id: 'family-nutrition-basics',
    title: 'Balanced Nutrition Essentials for Indian Families',
    category: 'Nutrition',
    icon: '🥗',
    readTime: '3 min read',
    summary: 'Achieving adequate protein, vitamins, and micronutrients in everyday vegetarian and coastal meals.',
    body: `A common nutritional blind spot in Indian household diets is protein deficiency combined with excess refined carbohydrates. While curries and gravies provide great flavor, meeting macro and micronutrient targets requires deliberate culinary planning.

Boosting Protein Intake:
Adults require approximately 0.8 to 1 gram of protein per kilogram of body weight daily. Ensure every meal contains an identifiable protein anchor: boiled eggs, sprouted mung beans, paneer, tofu, soya chunks, fish curry, or thick dal.

Micronutrients to Watch:
- Vitamin D3: Despite living in sunny climates, over 70% of Indians test deficient due to indoor lifestyles and melanin absorption. Supplementation or routine blood testing is advised.
- Vitamin B12: Essential for neurological health and red blood cell production. Almost all strict vegetarians require occasional B12 supplementation.
- Iron: Crucial for adolescent girls and pregnant women to prevent nutritional anemia. Pair iron-rich greens with citrus fruits (Vitamin C) for optimal bioavailability.`,
    tags: ['Vitamins', 'Balanced Meals', 'Immunity'],
  },
  {
    id: 'benefits-daily-walking',
    title: 'The Transformative Science of 30 Minutes of Daily Walking',
    category: 'Activity',
    icon: '🚶',
    readTime: '3 min read',
    summary: 'Why walking is the most sustainable, high-impact cardiovascular exercise for all ages.',
    body: `You don't need a high-cost gym subscription or intense marathon training to significantly extend cardiovascular longevity. Clinical studies consistently prove that 30 minutes of moderate-paced walking five days a week lowers the risk of coronary heart disease by nearly 20%.

Key Advantages of Daily Walking:
1. Gentle on Joints: Unlike high-impact running, walking maintains cartilage hydration without placing excessive stress on knee ligaments.
2. Mood and Mental Clarity: Walking stimulates endorphins and brain-derived neurotrophic factor (BDNF), reducing mild anxiety and depression.
3. Enhanced Digestion: A gentle evening stroll stimulates peristalsis, alleviating bloating and acidity.
4. Easy Habit Stacking: Walk while speaking on phone calls, take evening walks with family members, or use stairs instead of elevators.`,
    tags: ['Fitness', 'Exercise', 'Cardio'],
  },
  {
    id: 'childhood-vaccination-schedule',
    title: 'Essential Childhood & Adolescent Vaccination Guide',
    category: 'Vaccination',
    icon: '💉',
    readTime: '5 min read',
    summary: 'A timeline of mandatory and recommended immunizations from infancy through teenage years.',
    body: `Vaccines remain humanity's most effective defense against devastating communicable infections. Adhering to the Indian Academy of Pediatrics (IAP) and National Immunization Schedule protects your child and shields the wider community through herd immunity.

Key Milestones:
- At Birth: BCG (Tuberculosis), OPV-0 (Oral Polio), and Hepatitis B birth dose.
- 6, 10, and 14 Weeks: Pentavalent (Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib), Rotavirus (diarrhea prevention), Pneumococcal Conjugate (PCV), and Inactivated Polio Vaccine (IPV).
- 9 and 15 Months: MMR (Measles, Mumps, Rubella) and Varicella (Chickenpox).
- 16–24 Months: DTP booster and first typhoid conjugate vaccine.
- Adolescence (9–14 Years): HPV (Human Papillomavirus) vaccine for young girls and boys, providing robust protection against cervical and throat cancers later in life.

Always keep your child's physical vaccination booklet safely backed up in digital apps like HealthDesk.`,
    tags: ['Immunization', 'Pediatrics', 'Child Health'],
  },
  {
    id: 'mental-wellbeing-stress',
    title: 'Nurturing Mental Wellbeing in Fast-Paced Times',
    category: 'Mental Wellbeing',
    icon: '🧠',
    readTime: '4 min read',
    summary: 'Practical stress mitigation strategies, destigmatizing therapy, and protecting emotional balance.',
    body: `Health is incomplete without mental and emotional equilibrium. Chronic psychological stress elevates cortisol and adrenaline, contributing directly to gastrointestinal distress, insomnia, migraines, and elevated blood pressure.

Signs of Burnout:
- Persistent fatigue unmitigated by sleep
- Irritability over minor setbacks
- Difficulty concentrating or making decisions
- Withdrawal from social circles and family hobbies

Daily Practices for Resilience:
1. Establish Digital Boundaries: Avoid checking emails or doom-scrolling social media during the first 30 minutes of waking and the last 45 minutes before sleep.
2. Box Breathing Technique: Inhale slowly for 4 seconds, hold for 4, exhale for 4, and hold for 4. Repeating this for just 3 cycles down-regulates the sympathetic fight-or-flight nervous response.
3. Normalizing Conversations: Speaking to a counselor or psychologist is as standard as visiting a dentist for a toothache. Reach out whenever emotional weight feels unmanageable.`,
    tags: ['Mindfulness', 'Stress', 'Mental Health'],
  },
  {
    id: 'preventive-dental-care',
    title: 'Oral Health: Why Teeth and Gum Health Affect the Heart',
    category: 'Preventive',
    icon: '🦷',
    readTime: '3 min read',
    summary: 'The proven link between chronic periodontal inflammation and systemic cardiovascular disease.',
    body: `Modern medical research has established a strong connection between oral bacteria and systemic cardiovascular issues. Chronic gingivitis and gum disease allow inflammatory bacteria to enter the bloodstream, triggering vascular plaque inflammation and increasing endocarditis risks.

Golden Rules for Dental Longevity:
- Brush Twice Daily: Use soft-bristled brushes for a full 2 minutes, using gentle circular motions rather than harsh horizontal scrubbing.
- Floss Daily: Brushing alone misses nearly 35% of tooth surfaces where plaque accumulates between tight contacts.
- Biannual Cleanings: Schedule a professional scaling and dental exam every 6 months to remove hardened calculus before it damages jawbone density.
- Replace Your Brush: Change your toothbrush every 3 months, or immediately after recovering from a viral cold or sore throat.`,
    tags: ['Dental', 'Oral Hygiene', 'Heart Health'],
  },
  {
    id: 'screen-time-eye-strain',
    title: 'Protecting Vision in the Digital Age: Eye Strain Protocols',
    category: 'Preventive',
    icon: '👁️',
    readTime: '3 min read',
    summary: 'The 20-20-20 rule, combating dry eyes, and preventing premature myopia progression in kids.',
    body: `With smartphones, laptops, and smart TVs dominating both professional and recreational hours, Computer Vision Syndrome (CVS) has become a universal complaint. Common signs include dry eyes, blurred vision, burning sensations, and tension headaches.

The 20-20-20 Protocol:
Every 20 minutes of continuous screen viewing, pause and focus your eyes on an object at least 20 feet away for 20 seconds. This relaxes the ciliary muscles responsible for screen convergence.

Additional Ergonomic Tweaks:
1. Conscious Blinking: When focusing on screens, human blink rates drop from 18 times per minute to under 6 times per minute. Conscious blinking preserves the tear film.
2. Screen Positioning: The top of your computer monitor should be at or slightly below eye level, tilted back 10 to 20 degrees.
3. Outdoor Sunlight for Children: Encouraging kids to spend 60–90 minutes playing outdoors daily is clinically proven to reduce the onset and progression of childhood myopia.`,
    tags: ['Eye Care', 'Screen Time', 'Ergonomics'],
  },
  {
    id: 'healthy-cooking-oils',
    title: 'Navigating Cooking Oils: Smoke Points and Heart Health',
    category: 'Nutrition',
    icon: '🫙',
    readTime: '4 min read',
    summary: 'Sorting facts from fads on mustard oil, coconut oil, olive oil, and ghee in everyday cooking.',
    body: `Few topics create as much consumer confusion as edible cooking oils. The secret lies in matching the appropriate oil to the intended cooking temperature and prioritizing unrefined, cold-pressed variants over chemically solvent-extracted oils.

Understanding Smoke Points:
- High Heat & Deep Frying: Use oils with high smoke points like filtered groundnut (peanut) oil, mustard oil, or rice bran oil. They resist thermal breakdown into toxic aldehydes.
- Coastal & Traditional Cooking: Cold-pressed coconut oil provides medium-chain triglycerides (MCTs) and heat stability, best consumed in moderate portions.
- Low Heat Sautéing & Salads: Extra virgin olive oil is packed with anti-inflammatory polyphenols and oleic acid, ideal for gentle tosses or finishing dressings.

The Truth About Ghee:
Pure cow ghee contains butyric acid, which supports gut lining integrity. However, because it is concentrated in saturated fats, moderation is key—limiting intake to 1 to 2 teaspoons daily for healthy adults. Avoid reusing or repeatedly reheating fried oil.`,
    tags: ['Cooking Oils', 'Cholesterol', 'Kitchen Tips'],
  },
  {
    id: 'blood-sugar-levels-explained',
    title: 'Decoding Your Lab Report: Fasting Glucose vs. HbA1c',
    category: 'Diabetes',
    icon: '📊',
    readTime: '4 min read',
    summary: 'What do the numbers on your blood sugar test report actually mean for prediabetes and diabetes?',
    body: `Patients often ask why doctors order both Fasting Blood Glucose and HbA1c tests. Understanding the distinction helps you make informed choices during your physician consultations.

Fasting Blood Sugar (FBS):
This measures circulating glucose after an overnight fast of 8 to 12 hours. It represents a single snapshot in time.
- Normal: 70–99 mg/dL
- Prediabetes: 100–125 mg/dL
- Diabetes: 126 mg/dL or higher on two separate tests

HbA1c (Glycated Hemoglobin):
Glucose binds to hemoglobin molecules inside red blood cells. Since red blood cells live roughly 90 to 120 days, HbA1c provides a reliable rolling average of your blood sugar over the preceding 3 months.
- Normal: Under 5.7%
- Prediabetes: 5.7% – 6.4%
- Diabetes: 6.5% or higher

Prediabetes is reversible! Adopting lifestyle changes during the prediabetes phase can restore normal glycemic parameters in up to 70% of individuals without needing lifelong medications.`,
    tags: ['Diagnostics', 'HbA1c', 'Prediabetes'],
  },
  {
    id: 'heart-healthy-exercise',
    title: 'Cardiac Fitness: Safe Exercise Guidelines for Adults 40+',
    category: 'BP & Heart',
    icon: '🏃',
    readTime: '4 min read',
    summary: 'How to safely begin resistance training, yoga, and aerobic exercises without overstraining your heart.',
    body: `Beginning or intensifying an exercise regimen after age 40 provides profound cardiovascular and metabolic rewards, but approaching it prudently is essential to avoid acute cardiac overload or orthopedic injuries.

1. Obtain Medical Clearance:
If you have a history of smoking, elevated blood pressure, or a family history of early heart disease, undergo an ECG and physician checkup before initiating high-intensity sports.

2. Balance Aerobic and Strength Training:
Combine 150 minutes of weekly aerobic exercise (brisk walking, swimming, cycling) with 2 sessions of light resistance training. Building muscle tissue improves insulin sensitivity and supports metabolic rate.

3. Warm Up and Cool Down:
Never jump straight into vigorous exercise. Dedicate 5 to 7 minutes to joint mobility drills and dynamic stretching, allowing heart rate and arterial dilation to rise gradually.

4. Listen to Warning Signs:
Cease exercise immediately and seek emergency medical attention if you experience retrosternal chest tightness, unusual shortness of breath, unexplained dizziness, or pain radiating into the jaw or left shoulder.`,
    tags: ['Cardio', 'Fitness 40+', 'Safety'],
  },
];
