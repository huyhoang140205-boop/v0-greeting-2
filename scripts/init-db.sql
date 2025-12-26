-- =========================================
-- 1️⃣ DROP tất cả các table public nếu tồn tại
-- Thứ tự drop phải từ table con → table cha để tránh lỗi FK
-- =========================================

DROP TABLE IF EXISTS public.results CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.game_scores CASCADE;
DROP TABLE IF EXISTS public.game_plays CASCADE;
DROP TABLE IF EXISTS public.game CASCADE;
DROP TABLE IF EXISTS public.flashcards CASCADE;
DROP TABLE IF EXISTS public.class_members CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =========================================
-- 2️⃣ Tạo lại tất cả các table public
-- =========================================

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['teacher'::text, 'student'::text, 'admin'::text])),
  avatar_url text DEFAULT 'https://cdn-icons-png.flaticon.com/512/616/616408.png'::text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  teacher_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.class_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['teacher'::text, 'student'::text])),
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT class_members_pkey PRIMARY KEY (id),
  CONSTRAINT class_members_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.flashcards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  difficulty text DEFAULT 'medium'::text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  class_id uuid,
  CONSTRAINT flashcards_pkey PRIMARY KEY (id),
  CONSTRAINT flashcards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT flashcards_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);

CREATE TABLE public.game (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT now(),
  thumbnail_url text,
  category text,
  difficulty text DEFAULT 'normal'::text,
  is_active boolean DEFAULT true,
  updated_at timestamp without time zone DEFAULT now(),
  class_id uuid,
  CONSTRAINT game_pkey PRIMARY KEY (id),
  CONSTRAINT game_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);

CREATE TABLE public.game_plays (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  played_at timestamp without time zone DEFAULT now(),
  duration integer,
  combo integer DEFAULT 0,
  metadata jsonb,
  CONSTRAINT game_plays_pkey PRIMARY KEY (id),
  CONSTRAINT game_plays_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT game_plays_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.game(id)
);

CREATE TABLE public.game_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id uuid NOT NULL,
  best_score integer NOT NULL DEFAULT 0,
  plays_count integer NOT NULL DEFAULT 0,
  updated_at timestamp without time zone DEFAULT now(),
  last_score integer DEFAULT 0,
  last_played timestamp without time zone DEFAULT now(),
  max_combo integer DEFAULT 0,
  average_score numeric DEFAULT 0,
  rank integer,
  class_id uuid,
  CONSTRAINT game_scores_pkey PRIMARY KEY (id),
  CONSTRAINT game_scores_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT game_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT game_scores_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.game(id)
);

CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  class_id uuid,
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT notes_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);

CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  question_ids uuid[] DEFAULT '{}'::uuid[],
  total_points integer DEFAULT 0 CHECK (total_points >= 0),
  class_id uuid,
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT quizzes_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);

CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer character NOT NULL CHECK (correct_answer = ANY (ARRAY['A'::bpchar, 'B'::bpchar, 'C'::bpchar, 'D'::bpchar])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  points integer NOT NULL DEFAULT 1 CHECK (points >= 0),
  created_by uuid,
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id),
  CONSTRAINT quiz_questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 0),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  completed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT results_pkey PRIMARY KEY (id),
  CONSTRAINT results_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);

-- =========================================
-- 3️⃣ Enable Row Level Security (RLS)
-- =========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 4️⃣ Create RLS Policies
-- =========================================

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Classes: Teachers can manage their classes, students can view enrolled classes
CREATE POLICY "Teachers can view their classes" ON public.classes FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Students can view their enrolled classes" ON public.classes FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.class_members WHERE class_members.class_id = classes.id AND class_members.user_id = auth.uid())
);
CREATE POLICY "Teachers can create classes" ON public.classes FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers can update their classes" ON public.classes FOR UPDATE USING (teacher_id = auth.uid());

-- Class Members: Students can view class members, teachers can manage
CREATE POLICY "Users can view class members of enrolled classes" ON public.class_members FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.class_members cm WHERE cm.class_id = class_members.class_id AND cm.user_id = auth.uid())
);

-- Flashcards: Access through class membership
CREATE POLICY "Users can view flashcards in their classes" ON public.flashcards FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.class_members WHERE class_members.class_id = flashcards.class_id AND class_members.user_id = auth.uid())
);

-- Games: Access through class
CREATE POLICY "Users can view games in their classes" ON public.game FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.class_members WHERE class_members.class_id = game.class_id AND class_members.user_id = auth.uid())
);

-- Game Plays: Users can only see their own plays
CREATE POLICY "Users can view their own game plays" ON public.game_plays FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own game plays" ON public.game_plays FOR INSERT WITH CHECK (user_id = auth.uid());

-- Game Scores: Users can view scores of their class
CREATE POLICY "Users can view game scores in their classes" ON public.game_scores FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.class_members WHERE class_members.class_id = game_scores.class_id AND class_members.user_id = auth.uid())
);

-- Notes: Users can only see their own notes
CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create notes in their classes" ON public.notes FOR INSERT WITH CHECK (
  user_id = auth.uid() AND EXISTS(SELECT 1 FROM public.class_members WHERE class_members.class_id = notes.class_id AND class_members.user_id = auth.uid())
);

-- Quizzes: Access through class membership
CREATE POLICY "Users can view quizzes in their classes" ON public.quizzes FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.class_members WHERE class_members.class_id = quizzes.class_id AND class_members.user_id = auth.uid())
);

-- Quiz Questions: Access through quiz
CREATE POLICY "Users can view questions of accessible quizzes" ON public.quiz_questions FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.quizzes WHERE quizzes.id = quiz_questions.quiz_id 
    AND EXISTS(SELECT 1 FROM public.class_members WHERE class_members.class_id = quizzes.class_id AND class_members.user_id = auth.uid()))
);

-- Results: Users can only see their own results
CREATE POLICY "Users can view their own results" ON public.results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own results" ON public.results FOR INSERT WITH CHECK (user_id = auth.uid());

-- =========================================
-- 5️⃣ Create Trigger for Profile Creation
-- =========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
