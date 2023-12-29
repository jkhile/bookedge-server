--
-- PostgreSQL database dump
--

-- Dumped from database version 15.2
-- Dumped by pg_dump version 15.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: books; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public.books (
    id integer NOT NULL,
    fk_imprint integer,
    derived_type text DEFAULT 'original'::text,
    fk_derived_from integer,
    title text DEFAULT ''::text,
    subtitle text DEFAULT ''::text,
    accounting_code text DEFAULT ''::text,
    isbn_paperback text DEFAULT ''::text,
    isbn_hardcover text DEFAULT ''::text,
    isbn_epub text DEFAULT ''::text,
    isbn_ibooks text DEFAULT ''::text,
    book_status text DEFAULT 'contract negotiation'::text,
    copyright_holder text DEFAULT ''::text,
    copyright_year text DEFAULT ''::text,
    language text DEFAULT ''::text,
    short_description text DEFAULT ''::text,
    long_description text DEFAULT ''::text,
    back_cover_text text DEFAULT ''::text,
    jacket_front_text text DEFAULT ''::text,
    jacket_back_text text DEFAULT ''::text,
    is_public_domain boolean DEFAULT false,
    keywords text DEFAULT ''::text,
    bisac_code_1 text DEFAULT ''::text,
    bisac_code_2 text DEFAULT ''::text,
    bisac_code_3 text DEFAULT ''::text,
    bisac_name_1 text DEFAULT ''::text,
    bisac_name_2 text DEFAULT ''::text,
    bisac_name_3 text DEFAULT ''::text,
    amazon_category_1 text DEFAULT ''::text,
    amazon_category_2 text DEFAULT ''::text,
    amazon_category_3 text DEFAULT ''::text,
    thema text DEFAULT ''::text,
    audience text DEFAULT ''::text,
    series_name text DEFAULT ''::text,
    series_number integer DEFAULT 0,
    edition_name text DEFAULT ''::text,
    edition_number integer DEFAULT 0,
    right_to_left boolean DEFAULT false,
    author text DEFAULT ''::text,
    contains_prior_work text DEFAULT ''::text,
    contains_others_work text DEFAULT ''::text,
    web_domain text DEFAULT ''::text,
    published_word_count integer DEFAULT 0,
    image_count integer DEFAULT 0,
    press_contact text DEFAULT ''::text,
    legal_notice text DEFAULT ''::text,
    featured_ads text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    created_at text,
    fk_created_by integer
);


ALTER TABLE public.books OWNER TO johnhile;

--
-- Name: books-history; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public."books-history" (
    id integer NOT NULL,
    fk_book integer,
    fk_user integer,
    user_email text DEFAULT ''::text,
    change_date text DEFAULT ''::text,
    op text DEFAULT ''::text,
    path text DEFAULT ''::text,
    value text DEFAULT ''::text
);


ALTER TABLE public."books-history" OWNER TO johnhile;

--
-- Name: books-history_id_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public."books-history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."books-history_id_seq" OWNER TO johnhile;

--
-- Name: books-history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public."books-history_id_seq" OWNED BY public."books-history".id;


--
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.books_id_seq OWNER TO johnhile;

--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- Name: contributors; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public.contributors (
    id integer NOT NULL,
    fk_book integer,
    contributor_role text DEFAULT ''::text,
    legal_name text DEFAULT ''::text,
    published_name text DEFAULT ''::text,
    biography text DEFAULT ''::text,
    email text DEFAULT ''::text,
    address text DEFAULT ''::text,
    phone text DEFAULT ''::text,
    wikipedia_page text DEFAULT ''::text,
    amazon_author_page text DEFAULT ''::text,
    author_website text DEFAULT ''::text,
    twitter text DEFAULT ''::text,
    instagram text DEFAULT ''::text,
    facebook text DEFAULT ''::text,
    linkedin text DEFAULT ''::text,
    goodreads text DEFAULT ''::text,
    tiktok text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    created_at text,
    fk_created_by integer
);


ALTER TABLE public.contributors OWNER TO johnhile;

--
-- Name: contributors_id_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public.contributors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contributors_id_seq OWNER TO johnhile;

--
-- Name: contributors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public.contributors_id_seq OWNED BY public.contributors.id;


--
-- Name: imprints; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public.imprints (
    id integer NOT NULL,
    imprint_name text DEFAULT ''::text,
    accounting_code text DEFAULT ''::text,
    imprint_status text DEFAULT 'active'::text,
    contact_name text DEFAULT ''::text,
    address1 text DEFAULT ''::text,
    address2 text DEFAULT ''::text,
    city text DEFAULT ''::text,
    state text DEFAULT ''::text,
    postal_code text DEFAULT ''::text,
    country text DEFAULT ''::text,
    email text DEFAULT ''::text,
    phone text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    created_at text,
    fk_created_by integer
);


ALTER TABLE public.imprints OWNER TO johnhile;

--
-- Name: imprints_id_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public.imprints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.imprints_id_seq OWNER TO johnhile;

--
-- Name: imprints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public.imprints_id_seq OWNED BY public.imprints.id;


--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO johnhile;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knex_migrations_id_seq OWNER TO johnhile;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO johnhile;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knex_migrations_lock_index_seq OWNER TO johnhile;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- Name: log-messages; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public."log-messages" (
    id integer NOT NULL,
    text character varying(255)
);


ALTER TABLE public."log-messages" OWNER TO johnhile;

--
-- Name: log-messages_id_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public."log-messages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."log-messages_id_seq" OWNER TO johnhile;

--
-- Name: log-messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public."log-messages_id_seq" OWNED BY public."log-messages".id;


--
-- Name: pricing; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public.pricing (
    id integer NOT NULL,
    fk_release integer,
    start_date text DEFAULT ''::text,
    us_srp real DEFAULT '0'::real,
    us_discount real DEFAULT '0'::real,
    us_returnable text DEFAULT 'no'::text,
    uk_srp real DEFAULT '0'::real,
    uk_discount real DEFAULT '0'::real,
    uk_returnable text DEFAULT 'no'::text,
    eu_srp real DEFAULT '0'::real,
    eu_discount real DEFAULT '0'::real,
    eu_returnable text DEFAULT 'no'::text,
    ca_srp real DEFAULT '0'::real,
    ca_discount real DEFAULT '0'::real,
    ca_returnable text DEFAULT 'no'::text,
    au_srp real DEFAULT '0'::real,
    au_discount real DEFAULT '0'::real,
    au_returnable text DEFAULT 'no'::text,
    gc_srp real DEFAULT '0'::real,
    gc_discount real DEFAULT '0'::real,
    gc_returnable text DEFAULT 'no'::text,
    created_at text,
    fk_created_by integer
);


ALTER TABLE public.pricing OWNER TO johnhile;

--
-- Name: pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public.pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pricing_id_seq OWNER TO johnhile;

--
-- Name: pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public.pricing_id_seq OWNED BY public.pricing.id;


--
-- Name: releases; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public.releases (
    id integer NOT NULL,
    fk_book integer,
    release_status text DEFAULT 'active'::text,
    release_type text DEFAULT ''::text,
    submission_date text DEFAULT ''::text,
    acceptance_date text DEFAULT ''::text,
    pre_order_date text DEFAULT ''::text,
    publication_date text DEFAULT ''::text,
    preorder boolean DEFAULT false,
    sku text DEFAULT ''::text,
    trim_size text DEFAULT ''::text,
    binding text DEFAULT ''::text,
    page_count integer DEFAULT 0,
    spine_width real DEFAULT '0'::real,
    color text DEFAULT ''::text,
    paper text DEFAULT ''::text,
    cover_finish text DEFAULT ''::text,
    carton_quantity integer DEFAULT 0,
    weight real DEFAULT '0'::real,
    full_distribution boolean DEFAULT true,
    returnable text DEFAULT 'no'::text,
    enable_look_inside boolean DEFAULT true,
    kdp_select boolean DEFAULT false,
    kdp_match_book boolean DEFAULT false,
    asin text DEFAULT ''::text,
    drm boolean DEFAULT false,
    notes text DEFAULT ''::text,
    created_at text,
    fk_created_by integer
);


ALTER TABLE public.releases OWNER TO johnhile;

--
-- Name: releases_id_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public.releases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.releases_id_seq OWNER TO johnhile;

--
-- Name: releases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public.releases_id_seq OWNED BY public.releases.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255),
    password character varying(255),
    "googleId" character varying(255),
    access_token text DEFAULT ''::text,
    access_token_expires text DEFAULT ''::text,
    refresh_token text DEFAULT ''::text,
    user_status text DEFAULT 'active'::text,
    roles text[] DEFAULT ARRAY[]::text[],
    created_at text,
    fk_created_by integer
);


ALTER TABLE public.users OWNER TO johnhile;

--
-- Name: users-imprints; Type: TABLE; Schema: public; Owner: johnhile
--

CREATE TABLE public."users-imprints" (
    id integer NOT NULL,
    fk_user integer,
    fk_imprint integer
);


ALTER TABLE public."users-imprints" OWNER TO johnhile;

--
-- Name: users-imprints_id_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public."users-imprints_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."users-imprints_id_seq" OWNER TO johnhile;

--
-- Name: users-imprints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public."users-imprints_id_seq" OWNED BY public."users-imprints".id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: johnhile
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO johnhile;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: johnhile
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: books id; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- Name: books-history id; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public."books-history" ALTER COLUMN id SET DEFAULT nextval('public."books-history_id_seq"'::regclass);


--
-- Name: contributors id; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.contributors ALTER COLUMN id SET DEFAULT nextval('public.contributors_id_seq'::regclass);


--
-- Name: imprints id; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.imprints ALTER COLUMN id SET DEFAULT nextval('public.imprints_id_seq'::regclass);


--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Name: log-messages id; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public."log-messages" ALTER COLUMN id SET DEFAULT nextval('public."log-messages_id_seq"'::regclass);


--
-- Name: pricing id; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.pricing ALTER COLUMN id SET DEFAULT nextval('public.pricing_id_seq'::regclass);


--
-- Name: releases id; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.releases ALTER COLUMN id SET DEFAULT nextval('public.releases_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: users-imprints id; Type: DEFAULT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public."users-imprints" ALTER COLUMN id SET DEFAULT nextval('public."users-imprints_id_seq"'::regclass);


--
-- Name: books-history books-history_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public."books-history"
    ADD CONSTRAINT "books-history_pkey" PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: contributors contributors_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.contributors
    ADD CONSTRAINT contributors_pkey PRIMARY KEY (id);


--
-- Name: imprints imprints_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.imprints
    ADD CONSTRAINT imprints_pkey PRIMARY KEY (id);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: log-messages log-messages_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public."log-messages"
    ADD CONSTRAINT "log-messages_pkey" PRIMARY KEY (id);


--
-- Name: pricing pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.pricing
    ADD CONSTRAINT pricing_pkey PRIMARY KEY (id);


--
-- Name: releases releases_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.releases
    ADD CONSTRAINT releases_pkey PRIMARY KEY (id);


--
-- Name: users-imprints users-imprints_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public."users-imprints"
    ADD CONSTRAINT "users-imprints_pkey" PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: books books_fk_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_fk_created_by_foreign FOREIGN KEY (fk_created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: books books_fk_derived_from_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_fk_derived_from_foreign FOREIGN KEY (fk_derived_from) REFERENCES public.books(id) ON DELETE RESTRICT;


--
-- Name: books books_fk_imprint_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_fk_imprint_foreign FOREIGN KEY (fk_imprint) REFERENCES public.imprints(id) ON DELETE RESTRICT;


--
-- Name: books-history books_history_fk_book_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public."books-history"
    ADD CONSTRAINT books_history_fk_book_foreign FOREIGN KEY (fk_book) REFERENCES public.books(id) ON DELETE RESTRICT;


--
-- Name: books-history books_history_fk_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public."books-history"
    ADD CONSTRAINT books_history_fk_user_foreign FOREIGN KEY (fk_user) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: contributors contributors_fk_book_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.contributors
    ADD CONSTRAINT contributors_fk_book_foreign FOREIGN KEY (fk_book) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: contributors contributors_fk_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.contributors
    ADD CONSTRAINT contributors_fk_created_by_foreign FOREIGN KEY (fk_created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: imprints imprints_fk_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.imprints
    ADD CONSTRAINT imprints_fk_created_by_foreign FOREIGN KEY (fk_created_by) REFERENCES public.users(id);


--
-- Name: pricing pricing_fk_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.pricing
    ADD CONSTRAINT pricing_fk_created_by_foreign FOREIGN KEY (fk_created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: pricing pricing_fk_release_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.pricing
    ADD CONSTRAINT pricing_fk_release_foreign FOREIGN KEY (fk_release) REFERENCES public.releases(id) ON DELETE CASCADE;


--
-- Name: releases releases_fk_book_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.releases
    ADD CONSTRAINT releases_fk_book_foreign FOREIGN KEY (fk_book) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: releases releases_fk_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.releases
    ADD CONSTRAINT releases_fk_created_by_foreign FOREIGN KEY (fk_created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: users users_fk_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_fk_created_by_foreign FOREIGN KEY (fk_created_by) REFERENCES public.users(id);


--
-- Name: users-imprints users_imprints_fk_imprint_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public."users-imprints"
    ADD CONSTRAINT users_imprints_fk_imprint_foreign FOREIGN KEY (fk_imprint) REFERENCES public.imprints(id) ON DELETE RESTRICT;


--
-- Name: users-imprints users_imprints_fk_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: johnhile
--

ALTER TABLE ONLY public."users-imprints"
    ADD CONSTRAINT users_imprints_fk_user_foreign FOREIGN KEY (fk_user) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

