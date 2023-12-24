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
    derived_type character varying(32) DEFAULT 'original'::character varying,
    fk_derived_from integer,
    title character varying(255) DEFAULT ''::character varying,
    subtitle character varying(255) DEFAULT ''::character varying,
    accounting_code character varying(255) DEFAULT ''::character varying,
    isbn_paperback character varying(30) DEFAULT ''::character varying,
    isbn_hardcover character varying(30) DEFAULT ''::character varying,
    isbn_epub character varying(30) DEFAULT ''::character varying,
    isbn_ibooks character varying(30) DEFAULT ''::character varying,
    book_status character varying(255) DEFAULT 'contract negotiation'::character varying,
    copyright_holder character varying(255) DEFAULT ''::character varying,
    copyright_year character varying(255) DEFAULT ''::character varying,
    language character varying(255) DEFAULT ''::character varying,
    short_description character varying(1000) DEFAULT ''::character varying,
    long_description character varying(5000) DEFAULT ''::character varying,
    back_cover_text character varying(6000) DEFAULT ''::character varying,
    jacket_front_text character varying(255) DEFAULT ''::character varying,
    jacket_back_text character varying(255) DEFAULT ''::character varying,
    is_public_domain boolean DEFAULT false,
    keywords character varying(2000) DEFAULT ''::character varying,
    bisac_code_1 character varying(255) DEFAULT ''::character varying,
    bisac_code_2 character varying(255) DEFAULT ''::character varying,
    bisac_code_3 character varying(255) DEFAULT ''::character varying,
    bisac_name_1 character varying(255) DEFAULT ''::character varying,
    bisac_name_2 character varying(255) DEFAULT ''::character varying,
    bisac_name_3 character varying(255) DEFAULT ''::character varying,
    amazon_category_1 character varying(255) DEFAULT ''::character varying,
    amazon_category_2 character varying(255) DEFAULT ''::character varying,
    amazon_category_3 character varying(255) DEFAULT ''::character varying,
    thema character varying(255) DEFAULT ''::character varying,
    audience character varying(255) DEFAULT ''::character varying,
    series_name character varying(255) DEFAULT ''::character varying,
    series_number integer DEFAULT 0,
    edition_name character varying(255) DEFAULT ''::character varying,
    edition_number integer DEFAULT 0,
    right_to_left boolean DEFAULT false,
    author character varying(255) DEFAULT ''::character varying,
    contains_prior_work character varying(255) DEFAULT ''::character varying,
    contains_others_work character varying(255) DEFAULT ''::character varying,
    web_domain character varying(255) DEFAULT ''::character varying,
    published_word_count integer DEFAULT 0,
    image_count integer DEFAULT 0,
    press_contact character varying(255) DEFAULT ''::character varying,
    legal_notice character varying(255) DEFAULT ''::character varying,
    featured_ads character varying(255) DEFAULT ''::character varying,
    notes character varying(255) DEFAULT ''::character varying,
    created_at character varying(32),
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
    user_email character varying(255) DEFAULT ''::character varying,
    change_date character varying(255) DEFAULT ''::character varying,
    op character varying(255) DEFAULT ''::character varying,
    path character varying(255) DEFAULT ''::character varying,
    value character varying(255) DEFAULT ''::character varying
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
    contributor_role character varying(255) DEFAULT ''::character varying,
    legal_name character varying(255) DEFAULT ''::character varying,
    published_name character varying(255) DEFAULT ''::character varying,
    biography character varying(255) DEFAULT ''::character varying,
    email character varying(255) DEFAULT ''::character varying,
    address character varying(255) DEFAULT ''::character varying,
    phone character varying(255) DEFAULT ''::character varying,
    wikipedia_page character varying(255) DEFAULT ''::character varying,
    amazon_author_page character varying(255) DEFAULT ''::character varying,
    author_website character varying(255) DEFAULT ''::character varying,
    twitter character varying(255) DEFAULT ''::character varying,
    instagram character varying(255) DEFAULT ''::character varying,
    facebook character varying(255) DEFAULT ''::character varying,
    linkedin character varying(255) DEFAULT ''::character varying,
    goodreads character varying(255) DEFAULT ''::character varying,
    tiktok character varying(255) DEFAULT ''::character varying,
    notes character varying(255) DEFAULT ''::character varying,
    created_at character varying(32),
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
    imprint_name character varying(255) DEFAULT ''::character varying,
    accounting_code character varying(255) DEFAULT ''::character varying,
    imprint_status character varying(255) DEFAULT 'active'::character varying,
    contact_name character varying(255) DEFAULT ''::character varying,
    address1 character varying(255) DEFAULT ''::character varying,
    address2 character varying(255) DEFAULT ''::character varying,
    city character varying(255) DEFAULT ''::character varying,
    state character varying(255) DEFAULT ''::character varying,
    postal_code character varying(255) DEFAULT ''::character varying,
    country character varying(255) DEFAULT ''::character varying,
    email character varying(255) DEFAULT ''::character varying,
    phone character varying(255) DEFAULT ''::character varying,
    notes character varying(255) DEFAULT ''::character varying,
    created_at character varying(255),
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
    start_date character varying(32) DEFAULT ''::character varying,
    expiration_date character varying(32) DEFAULT ''::character varying,
    us_srp real DEFAULT '0'::real,
    us_discount real DEFAULT '0'::real,
    us_returnable character varying(255) DEFAULT 'no'::character varying,
    uk_srp real DEFAULT '0'::real,
    uk_discount real DEFAULT '0'::real,
    uk_returnable character varying(255) DEFAULT 'no'::character varying,
    eu_srp real DEFAULT '0'::real,
    eu_discount real DEFAULT '0'::real,
    eu_returnable character varying(255) DEFAULT 'no'::character varying,
    ca_srp real DEFAULT '0'::real,
    ca_discount real DEFAULT '0'::real,
    ca_returnable character varying(255) DEFAULT 'no'::character varying,
    au_srp real DEFAULT '0'::real,
    au_discount real DEFAULT '0'::real,
    au_returnable character varying(255) DEFAULT 'no'::character varying,
    gc_srp real DEFAULT '0'::real,
    gc_discount real DEFAULT '0'::real,
    gc_returnable character varying(255) DEFAULT 'no'::character varying,
    created_at character varying(32),
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
    release_status character varying(255) DEFAULT 'active'::character varying,
    release_type character varying(255) DEFAULT ''::character varying,
    submission_date character varying(32) DEFAULT ''::character varying,
    acceptance_date character varying(32) DEFAULT ''::character varying,
    pre_order_date character varying(32) DEFAULT ''::character varying,
    publication_date character varying(32) DEFAULT ''::character varying,
    preorder boolean DEFAULT false,
    sku character varying(255) DEFAULT ''::character varying,
    trim_size character varying(255) DEFAULT ''::character varying,
    binding character varying(255) DEFAULT ''::character varying,
    page_count integer DEFAULT 0,
    spine_width real DEFAULT '0'::real,
    color character varying(255) DEFAULT ''::character varying,
    paper character varying(255) DEFAULT ''::character varying,
    cover_finish character varying(255) DEFAULT ''::character varying,
    carton_quantity integer DEFAULT 0,
    weight real DEFAULT '0'::real,
    full_distribution boolean DEFAULT true,
    returnable character varying(255) DEFAULT 'no'::character varying,
    enable_look_inside boolean DEFAULT true,
    kdp_select boolean DEFAULT false,
    kdp_match_book boolean DEFAULT false,
    asin character varying(255) DEFAULT ''::character varying,
    drm boolean DEFAULT false,
    notes character varying(255) DEFAULT ''::character varying,
    created_at character varying(32),
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
    access_token character varying(255) DEFAULT ''::character varying,
    access_token_expires character varying(255) DEFAULT ''::character varying,
    refresh_token character varying(255) DEFAULT ''::character varying,
    user_status character varying(255) DEFAULT 'active'::character varying,
    roles text[] DEFAULT ARRAY[]::text[],
    created_at character varying(255),
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

