--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

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
-- Name: client_departments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_departments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    client_id character varying NOT NULL,
    department_type text NOT NULL,
    contact_name text,
    contact_email text,
    contact_phone text
);


ALTER TABLE public.client_departments OWNER TO neondb_owner;

--
-- Name: client_locations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_locations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    client_id character varying NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    address_en text NOT NULL,
    address_ar text NOT NULL,
    city text,
    country text,
    is_headquarters boolean DEFAULT false,
    phone text
);


ALTER TABLE public.client_locations OWNER TO neondb_owner;

--
-- Name: client_pricing; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_pricing (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    client_id character varying NOT NULL,
    product_id character varying NOT NULL,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    imported_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.client_pricing OWNER TO neondb_owner;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clients (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text,
    phone text,
    is_admin boolean DEFAULT false NOT NULL,
    user_id character varying
);


ALTER TABLE public.clients OWNER TO neondb_owner;

--
-- Name: lta_clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lta_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lta_id uuid NOT NULL,
    client_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lta_clients OWNER TO neondb_owner;

--
-- Name: lta_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lta_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lta_id uuid NOT NULL,
    product_id character varying NOT NULL,
    contract_price numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lta_products OWNER TO neondb_owner;

--
-- Name: ltas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ltas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    description_en text,
    description_ar text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ltas OWNER TO neondb_owner;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    client_id character varying NOT NULL,
    type text NOT NULL,
    title_en text NOT NULL,
    title_ar text NOT NULL,
    message_en text NOT NULL,
    message_ar text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: order_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.order_templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    client_id character varying NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    items text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_templates OWNER TO neondb_owner;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    client_id character varying NOT NULL,
    lta_id uuid,
    items text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    pipefy_card_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    description_en text,
    description_ar text,
    sku text NOT NULL,
    image_url text,
    category text,
    metadata text,
    vendor_id character varying,
    category_num text,
    main_category text,
    unit_type text,
    unit text,
    unit_per_box text,
    cost_price_per_box text,
    cost_price_per_piece text,
    selling_price_pack text,
    selling_price_piece text,
    specifications_ar text
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: vendors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.vendors (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vendor_number text NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    contact_email text,
    contact_phone text,
    address text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendors OWNER TO neondb_owner;

--
-- Data for Name: client_departments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_departments (id, client_id, department_type, contact_name, contact_email, contact_phone) FROM stdin;
\.


--
-- Data for Name: client_locations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_locations (id, client_id, name_en, name_ar, address_en, address_ar, city, country, is_headquarters, phone) FROM stdin;
\.


--
-- Data for Name: client_pricing; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_pricing (id, client_id, product_id, price, currency, imported_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clients (id, name_en, name_ar, username, password, email, phone, is_admin, user_id) FROM stdin;
dccb468b-394f-48f9-8f07-5e11966e9337	Taha Qadi	Taha Qadi	tahaqadi@gmail.com		tahaqadi@gmail.com	\N	t	48391860
0c16a5a9-2f03-4567-a0f7-efa389f7f22e	Loai	لؤي	loai qadi	123qweasd	info@qadi.ps	0592555536	t	\N
\.


--
-- Data for Name: lta_clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lta_clients (id, lta_id, client_id, created_at) FROM stdin;
1bf364c2-0b60-46a6-8907-d3aa48cca91e	6f3629b8-f44d-46f1-9c5c-42a2d5bed6c6	dccb468b-394f-48f9-8f07-5e11966e9337	2025-10-09 11:53:28.291795
\.


--
-- Data for Name: lta_products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lta_products (id, lta_id, product_id, contract_price, currency, created_at) FROM stdin;
\.


--
-- Data for Name: ltas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ltas (id, name_en, name_ar, description_en, description_ar, start_date, end_date, status, created_at) FROM stdin;
6f3629b8-f44d-46f1-9c5c-42a2d5bed6c6	ااا	ةاات			2025-10-09 11:17:07.051	2026-10-09 11:17:07.051	active	2025-10-09 11:17:13.09053
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, client_id, type, title_en, title_ar, message_en, message_ar, is_read, metadata, created_at) FROM stdin;
1d06326b-9e5b-4f43-94f1-3dd79f44ed1d	dccb468b-394f-48f9-8f07-5e11966e9337	price_request_sent	Price Request Submitted	تم إرسال طلب السعر	Your price request for 1 product(s) has been sent to administrators	تم إرسال طلب السعر الخاص بك لـ 1 منتج إلى المسؤولين	t	"{\\"productIds\\":[\\"360e88e2-9671-42a7-86c0-46cc6b537d0e\\"]}"	2025-10-10 10:15:51.469537
8039170f-e8f7-4680-9beb-509847f07e2d	dccb468b-394f-48f9-8f07-5e11966e9337	price_request_sent	Price Request Submitted	تم إرسال طلب السعر	Your price request for 1 product(s) has been sent to administrators	تم إرسال طلب السعر الخاص بك لـ 1 منتج إلى المسؤولين	f	"{\\"productIds\\":[\\"f9191aaa-478e-4a7a-ba08-0aea247dd4f0\\"]}"	2025-10-10 10:40:56.170018
\.


--
-- Data for Name: order_templates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.order_templates (id, client_id, name_en, name_ar, items, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, client_id, lta_id, items, total_amount, status, pipefy_card_id, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, name_en, name_ar, description_en, description_ar, sku, image_url, category, metadata, vendor_id, category_num, main_category, unit_type, unit, unit_per_box, cost_price_per_box, cost_price_per_piece, selling_price_pack, selling_price_piece, specifications_ar) FROM stdin;
42ac74ca-a996-453c-bb1b-0ef7f33142de	Silver knives (20/1)	سكاكين سلفر (20/1)	\N	\N	110100001	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	50	135	2.7	250	5	جولف بلاستيك الصناعية
3474b772-47de-49fa-9769-e45d6256922e	Beige reinforced spoons	معالق مقوى بيج	\N	\N	110100002	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	40	115	2.88	150	4	جولف بلاستيك الصناعية
fc91d517-914d-4d13-954e-0cbeb77a9db7	Black knives (50/1)	سكاكين اسود (50/1)	\N	\N	110100003	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	40	95	2.38	120	3	زعتر علام -للبلاستيك والنايلون
1f020835-cee5-4157-b743-3bad70c5cacb	White thorn (100/1)	شوك أبيض (100/1)	\N	\N	110100004	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	20	75	3.75	101.25	5.06	ابو تبانه
e57225fc-1be1-4143-a9f0-4b7910a7e2d8	Black thorn (50/1)	شوك أسود (50/1)	\N	\N	110100005	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	40	75	1.88	160	4	الشروق للتوزيع للتجارة-موسى سكافي
8e634fbc-f879-417f-913b-8a691abc473b	wooden thorns	شوك خشب	\N	\N	110100006	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	40	240	6	400	10	فادي الزغير-المحيط الازرق
8d74c1f2-04a5-49c7-a79a-36f30a880807	Silver Choc (20/1)	شوك سلفر (20/1)	\N	\N	110100007	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	50	135	2.7	250	5	جولف بلاستيك الصناعية
febd9c97-623f-4633-972f-7da6530a900c	Transparent fork (50/1)	شوك شفاف (50/1)	\N	\N	110100008	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	40	75	1.88	140	3.5	الشروق للتوزيع للتجارة-موسى سكافي
8d4047ee-d2cb-4b4c-b1ef-7731fea8e573	Wood Fruit Pickers (1/100)	نكاشات فواكه خشب (1/100)	\N	\N	110100009	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	9751e859-f86b-4f8e-9910-872759456895	1101	أدوات مائدة	كمية	PCS	300	660	2.2	1500	5	حسن عوواده-محلات ليان للمواد للبلاستيكية
625cfb95-7b15-46f6-9137-adb4607e690a	Wood Fruit Pickers (1/50)	نكاشات فواكه خشب (1/50)	\N	\N	110100010	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	500	425	0.85	1250	2.5	فادي الزغير-المحيط الازرق
a4493bec-2d0c-4287-8393-6d76bae887e2	White spoons (100/1)	معالق أبيض (100/1)	\N	\N	110100011	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	50	115	2.3	200	4	ابو تبانه
6437940f-136c-46d4-a1ca-cffcbb7ccf67	black spoons	معالق أسود	\N	\N	110100012	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	40	75	1.88	140	3.5	الشروق للتوزيع للتجارة-موسى سكافي
acadfeca-9f8e-4ebe-bb69-0bdf50235169	wooden spoons	معالق خشب	\N	\N	110100013	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	40	240	6	400	10	فادي الزغير-المحيط الازرق
aaf47d95-263a-477a-b977-82560f9c2dbf	Silver spoons (20/1)	معالق سلفر (20/1)	\N	\N	110100014	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	50	135	2.7	250	5	جولف بلاستيك الصناعية
aef47f7f-a13a-467d-840b-52d880742531	Transparent spoons (50/1)	معالق شفاف (50/1)	\N	\N	110100015	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	40	75	1.88	140	3.5	الشروق للتوزيع للتجارة-موسى سكافي
74a211a0-d568-4369-90d3-de484dff05b2	Colored cardboard spoons (40/1)	معالق مقوى ملون (40/1)	\N	\N	110100016	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	40	115	2.88	160	4	ابو تبانه
f97323f9-2400-4369-9ded-c2c4633ab33a	Small spoons (1/100)	معالق صغير (100/1)	\N	\N	110100017	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	60	110	1.83	210	3.5	كرم المصري-سما للتجارة العامة
41c03c13-8d65-4563-993b-0b0e47b9cae5	Small silver spoons (20/1)	معالق صغير سلفر (20/1)	\N	\N	110100018	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	100	200	2	350	3.5	جولف بلاستيك الصناعية
bf3493da-6b32-4f1f-aa81-429d1369d357	Small silver spoons (1/48)	معالق صغير سلفر (1/48)	\N	\N	110100019	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	1101	أدوات مائدة	كمية	PCS	100	350	3.5	700	7	جونسون كلين - نشأت برناط-شركة الزين
4ec86498-fb9b-429f-a93c-fd9e1b23170f	Small transparent spoons (1/100)	معالق صغير شفاف (1/100)	\N	\N	110100020	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	46242857-67e8-4da9-8061-64d245592fa2	1101	أدوات مائدة	كمية	PCS	20	50	2.5	60	3	حامد ناصر الدين
068ec2cc-6403-4350-8185-770b8bbb2ea2	Crystal ice cream spoons	معالق كريستال بوظة	\N	\N	110100021	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	15	315	21	420	28	زعتر علام -للبلاستيك والنايلون
b4a631a6-f663-4012-ab62-75049691980d	Medium spoons (40/1)	معالق وسط(40/1)	\N	\N	110100022	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	d434411e-afa8-4b8c-9c07-fa3dff420a39	1101	أدوات مائدة	كمية	PCS	50	75	1.5	200	4	شركة جمانه
ab5f3e61-10b2-42a0-be17-c3ecee6df8a9	Crystal Fruit Picks	نكاشات فواكه كريستال	\N	\N	110100023	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	9751e859-f86b-4f8e-9910-872759456895	1101	أدوات مائدة	كمية	PCS	360	828	2.3	1800	5	حسن عوواده-محلات ليان للمواد للبلاستيكية
a60da7c5-005b-4b82-805b-bcda25b9ebd1	Beige knives	سكاكين بيج	\N	\N	110100025	\N	أدوات أكل (سكاكين، شوك، ملاعق)	\N	\N	1101	أدوات مائدة	كمية	PCS	20	70	3.5	100	5	الشروق للتوزيع للتجارة-موسى سكافي
529d3d7f-4c5c-43a8-92e6-bda493f87402	Fabric roll (100 meters)	رول قماش (100 متر)	\N	\N	110200001	\N	شراشف وأغطية طاولات	\N	46242857-67e8-4da9-8061-64d245592fa2	1102	أدوات مائدة	كمية	PCS	1	70	70	100	100	حامد ناصر الدين
d7eb11c6-5bce-45d2-94af-b2e46798b353	Fabric roll (25 meters)	رول قماش (25 متر)	\N	\N	110200002	\N	شراشف وأغطية طاولات	\N	\N	1102	أدوات مائدة	كمية	PCS	1	19	19	25	25	كرم المصري-سما للتجارة العامة
a1a94af8-63ad-44a7-898e-866edc2c6063	Dettol (500 ml)	ديتول (500 مل)	\N	\N	211300001	\N	معقمات ومطهرات عامة	\N	\N	2113	مواد تنظيف	كمية	PCS	24	252	10.5	360	15	بالكو
346739cd-84e1-4e7c-9954-d5d36cde9011	Tablecloth (1 kg)	شرشف طاولة (1 كغم)	\N	\N	110200003	\N	شراشف وأغطية طاولات	\N	\N	1102	أدوات مائدة	كمية	PCS	20	160	8	240	12	الرحمة للنايلون-وجدي الغانم
239bca0e-f7d3-4ed8-953e-d20c629cbf3d	colorful tablecloth	شرشف طاولة ملون	\N	\N	110200004	\N	شراشف وأغطية طاولات	\N	\N	1102	أدوات مائدة	كمية	PCS	30	55	1.83	90	3	الرحمة للنايلون-وجدي الغانم
ea995644-b24a-4282-a68d-d17d7758da05	Tablecloth (2 kg)	شرشف طاولة (2 كغم)	\N	\N	110200006	\N	شراشف وأغطية طاولات	\N	\N	1102	أدوات مائدة	كمية	PCS	10	160	16	240	24	الرحمة للنايلون-وجدي الغانم
6ce63694-73e6-4676-88d4-5aced1573bdc	10 inch oval bowl (20/1)	جاط بيضاوي 10انش(20/1)	\N	\N	110300001	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	25	75	3	125	5	بلاستيك القدس الصناعية التجارية -الاشمر
c98947de-908d-4c75-8ecf-6ed7d9d1dd42	Sugarcane plate (1/20 inch 10)	صحن قصب سكر (1/20 انش 10)	\N	\N	110300002	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	40	296	7.4	400	10	جولف بلاستيك الصناعية
317091df-528f-4f6d-9211-f67c55848e93	Sugarcane plate (1/20 inch 9)	صحن قصب سكر (1/20 انش 9)	\N	\N	110300003	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	40	264	6.6	360	9	جولف بلاستيك الصناعية
66a0dcd3-732f-4f75-aa27-00358abf95c7	Casserole dish (20/1)	صحن كسرول (20/1)	\N	\N	110300004	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	200	230	1.15	600	3	ابو تبانه
2383e1ab-263d-49d8-8a87-436207313cbb	Large plate (20/1)	صحن مجور كبير (20/1)	\N	\N	110300005	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	50	60	1.2	150	3	زعتر علام -للبلاستيك والنايلون
4413e14a-2adc-4747-943c-71465a6c9c24	Small white yogurt (20/1)	زبادي صغير أبيض (20/1)	\N	\N	110300006	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	100	75	0.75	100	1.01	زعتر علام -للبلاستيك والنايلون
f6e9effb-e57e-4448-b2c4-f3651e1e165c	10 inch plate	صحن 10 إنش	\N	\N	110300008	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	25	75	3	125	5	بلاستيك القدس الصناعية التجارية -الاشمر
295a4b68-cf67-4e2e-8511-f9261e52d694	21cm plate (20/1)	صحن 21سم (20/1)	\N	\N	110300009	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	50	75	1.5	175	3.5	بلاستيك القدس الصناعية التجارية -الاشمر
41572681-a4e4-439a-a9ed-109f779968ea	7 inch plate (20/1)	صحن 7 إنش (20/1)	\N	\N	110300010	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	50	40	0.8	125	2.5	بلاستيك القدس الصناعية التجارية -الاشمر
6b1d99fa-b990-410e-b906-1ebff6283e0d	7 inch plate (25/1)	صحن 7 إنش (25/1)	\N	\N	110300011	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	40	40	1	120	3	بلاستيك القدس الصناعية التجارية -الاشمر
44aca3d5-8eab-41f3-8101-74c2f0305898	9 inch plate (25/1)	صحن 9 إنش (25/1)	\N	\N	110300012	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	40	85	2.13	140	3.5	بلاستيك القدس الصناعية التجارية -الاشمر
fda284a4-828d-480a-aa61-81b95b6908d1	Black lunch box (3 sections)	لانش بوكس أسود (3 أقسام)	\N	\N	110300013	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	150	120	0.8	162	1.08	فاركو
0236678b-3c83-4b8b-ab0e-0070db40ebdb	Plain black lunch box (section)	لانش بوكس أسود سادة (قسم)	\N	\N	110300014	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	150	120	0.8	162	1.08	فاركو
11293d9d-73ac-42c3-abd3-56dacf3feb21	Black lunch box (2 compartments)	لانش بوكس أسود (قسمين)	\N	\N	110300015	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	\N	1103	أدوات مائدة	كمية	PCS	150	120	0.8	162	1.08	فاركو
6038c3c8-9b17-485d-a8b5-b5b34583e974	1/20 granulated sugar plate (500 ml)	صحن سكر مجور (20/1) (500 مل)	\N	\N	110300017	\N	أطباق للاستخدام الواحد (بلاستيك)	\N	d434411e-afa8-4b8c-9c07-fa3dff420a39	1103	أدوات مائدة	كمية	PCS	40	180	4.5	240	6	شركة جمانه
2f71d593-3c98-42f8-901f-a0c8d317b2f6	cork plate	صحن مجور فلين	\N	\N	110400001	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	1000	115	0.12	155.25	0.16	كرم المصري-سما للتجارة العامة
b80cf493-6d27-4711-823b-36d8497b9ab2	9 inch cork	فلين 9 انش	\N	\N	110400002	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	500	55	0.11	65	\N	طليب للتجاره والاستثمار
0ebb311e-f134-47c6-afbc-8c82f777a595	Cork (2 kg)	فلين (2 كغم)	\N	\N	110400003	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	200	60	0.3	85	\N	طليب للتجاره والاستثمار
d3bccd5d-8b16-4383-a029-d843fe20097a	8 inch cork	فلين 8 إنش	\N	\N	110400004	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	500	50	0.1	60	0.14	طليب للتجاره والاستثمار
ae1fbdf8-7238-4c39-8cb8-ac2a042ad8a1	11 inch round cork	فلين دائري 11 إنش	\N	\N	110400005	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	250	75	0.3	90	0.41	طليب للتجاره والاستثمار
527488cf-1981-472d-ac62-0b6eec5b3453	Cork (kg)	فلين (كغم)	\N	\N	110400006	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	250	48	0.19	65	0.25	طليب للتجاره والاستثمار
995edd21-dfa2-496b-b547-00463f56b01a	Square cork (half ounce)	فلين مربع (نص وقية)	\N	\N	110400007	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	500	50	0.1	65	0.15	طليب للتجاره والاستثمار
01707514-57fc-4cea-ad56-4c60de537e81	Cork (half a kg)	فلين (نص كغم)	\N	\N	110400008	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	250	32	0.13	40	0.19	طليب للتجاره والاستثمار
25045563-90a7-4cbf-8c60-79708bb88aca	small hamburger patty	فلين همبورغر صغير	\N	\N	110400009	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	250	34	0.14	40	0.2	طليب للتجاره والاستثمار
262ede10-c772-4443-9f3c-8a6615bc39fe	Large hamburger patty	فلين همبورغر كبير	\N	\N	110400010	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	250	36	0.14	45	0.21	طليب للتجاره والاستثمار
596f722d-acd9-4556-8ce0-f7479c2c7e61	Large cork	فلين وقية كبير	\N	\N	110400011	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	250	28	0.11	35	0.16	طليب للتجاره والاستثمار
40e23445-9399-4efc-9096-441fab8f28d4	Plain cork lunch box	لانش بوكس فلين سادة	\N	\N	110400012	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	250	50	0.2	65	0.29	طليب للتجاره والاستثمار
a1b3ce52-42bc-44c3-bf79-9369e13ad928	Cut cork lunch box	لانش بوكس فلين مقطع	\N	\N	110400013	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	250	50	0.2	65	0.29	طليب للتجاره والاستثمار
e1590352-5d7f-47c5-bc44-a0922ac46d82	12/15 tin plate (100/1)	صحن قصدير 12/15) (100/1)	\N	\N	110400014	\N	أطباق للاستخدام الواحد (فلين)	\N	\N	1104	أدوات مائدة	كمية	PCS	10	180	18	350	35	الكاظم
c4ce1974-d461-4711-9bc1-c38cc410ff1c	12/15 (100/1) tin plate	صحن قصدير 12/15 (100/1)	\N	\N	110500001	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	10	200	20	290	29	كرم المصري-سما للتجارة العامة
e9289372-08a8-4d71-b437-03fc719e3295	210 tin plate	صحن قصدير 210	\N	\N	110500002	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	200	160	0.8	300	1.5	كرم المصري-سما للتجارة العامة
27dbcaca-913b-4919-a6a7-5d0f31ac521e	2 kg tin plate	صحن قصدير 2كغم	\N	\N	110500003	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	400	288	0.72	400	1	كرم المصري-سما للتجارة العامة
0e24c2bd-e455-4f52-8d4a-f963dc0abc89	Jenstrom tin plate	صحن قصدير جنستروم	\N	\N	110500004	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	50	120	2.4	200	4	كرم المصري-سما للتجارة العامة
7b334813-ef4b-424a-8820-1f3d8e8b4ca6	small round tin plate	صحن قصدير دائري صغير	\N	\N	110500005	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	100	15	0.15	30	0.3	كرم المصري-سما للتجارة العامة
c71ca0c6-c02e-44aa-bf31-709dd1b74840	Deep tin plate kg	صحن قصدير كغم عميق	\N	\N	110500006	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	600	300	0.5	435	0.73	كرم المصري-سما للتجارة العامة
456fc391-9b9e-41bf-ab36-79e2d0f1bd05	Falcon deep tin plate kg	صحن قصدير كغم عميق فالكون	\N	\N	110500021	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	400	200	0.5	300	0.75	شركة جيليت-كولجيت للتوزيع-جعفر
52f386d1-3b38-415e-a531-8f6fd081f8a0	Round tin plate (ounce)	صحن قصدير مدور (وقية)	\N	\N	110500007	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	1000	280	0.28	400	0.4	كرم المصري-سما للتجارة العامة
fe94ff7a-6a58-4d7a-9e26-1d2e113a6a02	Half a kg tin plate	صحن قصدير نص كغم	\N	\N	110500008	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	600	156	0.26	270	0.45	كرم المصري-سما للتجارة العامة
532cb73b-0a18-4517-a35d-88dd7e422fe1	Half a kg cut tin plate	صحن قصدير نص كغم مقطع	\N	\N	110500009	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	600	198	0.33	300	0.5	كرم المصري-سما للتجارة العامة
32f0b0f4-6a94-4516-b815-452785f1b7c8	1 ounce tin plate	صحن قصدير وقية	\N	\N	110500010	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	1000	250	0.25	400	0.4	كرم المصري-سما للتجارة العامة
e08629cd-d7bd-4a26-b37a-539248c95319	small tin pots	طناجر قصدير صغيرة	\N	\N	110500011	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	300	600	2	1200	4	كرم المصري-سما للتجارة العامة
2576251b-c26f-40ce-af1c-2bfe15e030d0	large tin pots	طناجر قصدير كبيرة	\N	\N	110500012	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	300	1200	4	1800	6	كرم المصري-سما للتجارة العامة
84229a9e-8fd7-4817-8937-982ed4e2f65b	Medium tin pots	طناجر قصدير وسط	\N	\N	110500013	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	300	900	3	1500	5	كرم المصري-سما للتجارة العامة
d000f125-f292-4715-b05e-7a8651fb6c55	Foil lid (2 kg)	غطاء قصدير (2 كغم)	\N	\N	110500014	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	100	15	0.15	20	0.2	عباس مطاوع
ab101ad4-596c-407c-8308-371f24cd14be	deep tin lid	غطاء قصدير عميق	\N	\N	110500015	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	100	10	0.1	15	0.15	عباس مطاوع
270e2f12-e715-43a0-bb70-a0d47a2468ba	Foil lid (half a kg)	غطاء قصدير (نص كغم)	\N	\N	110500016	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	100	6	0.06	10	0.1	عباس مطاوع
639464b6-532c-4c6c-aad9-720b842d2311	flat tin lid	غطاء قصدير مفرود	\N	\N	110500017	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	100	12	0.12	20	0.2	عباس مطاوع
691299f9-f830-4b8c-967e-562f929335fe	tin lid (protective)	غطاء قصدير (وقية)	\N	\N	110500018	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	100	4	0.04	8	0.08	عباس مطاوع
b621534d-955a-4b94-a0fc-5585dc37fcb1	English Cake Tin (S\\*S\\*A)	قصدير إنجليش كيك (س\\*ص\\*ع)	\N	\N	110500019	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	1000	180	0.18	600	0.6	كرم المصري-سما للتجارة العامة
ba08f94b-8aa6-4553-badb-a84f41cf3173	cupcake tin	قصدير كب كيك	\N	\N	110500020	\N	أوعية وقوالب للطهي والتقديم (قصدير)	\N	\N	1105	أدوات مائدة	كمية	PCS	1	3.5	3.5	5	5	\N
06190625-b23f-4d03-b87d-09ac543fe286	Mobtex Cotton Pads (3/1)	فوط قطن موبتكس (3/1)	\N	\N	120200009	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	50	40	0.8	75	1.5	موبتكس
7f3bbc60-120d-4c36-98e1-0ac5bc6296bd	32 oz Popcorn Boxes (50/1)	علب بوشار 32 أوز (50/1)	\N	\N	110600001	\N	أطباق وعلب للاستخدام الواحد (ورق وكرتون)	\N	\N	1106	أدوات مائدة	كمية	PCS	10	220	22	300	30	جولف بلاستيك الصناعية
9579efee-5018-4ebe-a63d-bc547331b689	Cardboard boxes (38 oz)	علب كرتون (38 أوز)	\N	\N	110600002	\N	أطباق وعلب للاستخدام الواحد (ورق وكرتون)	\N	\N	1106	أدوات مائدة	كمية	PCS	300	250	0.83	300	1	فاركو
3f6261e0-1fc7-4acf-806b-348d188312a1	Platinum BBQ Fan	مهفة شواء بلاتينيوم	\N	\N	110700001	\N	أدوات ومستلزمات طهي وتقديم	\N	\N	1107	أدوات مائدة	كمية	PCS	48	72	1.5	192	4	جولف بلاستيك الصناعية
e83d0e5f-ea59-4335-8d71-e95a3b55a221	potato skewers	أسياخ بطاطا	\N	\N	110700002	\N	أدوات ومستلزمات طهي وتقديم	\N	\N	1107	أدوات مائدة	كمية	PCS	100	130	1.3	300	3	مروان عوايصة
9a432098-594e-4fd5-a452-3f84273e7b56	simplified wooden skewers	أسياخ خشب مبسط	\N	\N	110700003	\N	أدوات ومستلزمات طهي وتقديم	\N	\N	1107	أدوات مائدة	كمية	PCS	100	150	1.5	500	5	فادي الزغير-المحيط الازرق
8c926e83-3d34-46e0-8b47-d5da1957050c	round wooden skewers	أسياخ خشب دائري	\N	\N	110700004	\N	أدوات ومستلزمات طهي وتقديم	\N	\N	1107	أدوات مائدة	كمية	PCS	100	150	1.5	500	5	مروان عوايصة
ef788864-eab0-4492-b781-a9cb927c3ee9	hamburger skewers	أسياخ همبورغر	\N	\N	110700005	\N	أدوات ومستلزمات طهي وتقديم	\N	9751e859-f86b-4f8e-9910-872759456895	1107	أدوات مائدة	كمية	PCS	100	280	2.8	400	4	حسن عوواده-محلات ليان للمواد للبلاستيكية
64ce40dd-87d0-48e6-ac32-a4006570d518	Fuel buffet kerosene	فيول بوفيه كاز	\N	\N	110700006	\N	أدوات ومستلزمات طهي وتقديم	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	1107	أدوات مائدة	كمية	PCS	72	120	1.67	200	2.78	جونسون كلين - نشأت برناط-شركة الزين
98ed0546-665b-4ea6-a0d1-f25db327ca53	Crystal 120ml (10/1)	كريستال 120مل (10/1)	\N	\N	110800002	\N	علب وأكواب حلويات (كريستال/بلاستيك)	\N	\N	1108	أدوات مائدة	كمية	PCS	50	275	5.5	450	9	جولف بلاستيك الصناعية
97187a10-1092-4e8f-9bbe-cc9d065a8c40	Crystal 200ml (10/1)	كريستال 200مل (10/1)	\N	\N	110800003	\N	علب وأكواب حلويات (كريستال/بلاستيك)	\N	\N	1108	أدوات مائدة	كمية	PCS	50	325	6.5	500	10	جولف بلاستيك الصناعية
b40c3e2b-b9b7-42f9-a305-cb667127e0ed	Crystal 60ml (10/1)	كريستال 60مل (10/1)	\N	\N	110800004	\N	علب وأكواب حلويات (كريستال/بلاستيك)	\N	\N	1108	أدوات مائدة	كمية	PCS	50	225	4.5	400	8	جولف بلاستيك الصناعية
8f1185ab-0cf6-4849-9037-bf8cf12637cd	4 oz Cheesecake Boxes (Dome)	علب شيز كيك 4 اوز (قبة)	\N	\N	110800005	\N	علب وأكواب حلويات (كريستال/بلاستيك)	\N	\N	1108	أدوات مائدة	كمية	PCS	20	220	11	300	15	كرم المصري-سما للتجارة العامة
ade42508-df5e-4630-a619-894653fec91b	5 oz Cheesecake Boxes (Dome)	علب شيزكيك 5 اوز (قبة)	\N	\N	110800006	\N	علب وأكواب حلويات (كريستال/بلاستيك)	\N	\N	1108	أدوات مائدة	كمية	PCS	20	240	12	360	18	كرم المصري-سما للتجارة العامة
2c6366ab-2ea6-4905-9fe7-a2ee1fed3ad1	2 oz Crystal Cups (24/1)	فناجين 2 أوز كريستال (24/1)	\N	\N	111000001	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	40	125	3.13	280	7	فاركو
27272021-9259-4b41-8e44-9cc9edf5b385	2 oz Crystal Cups (25/1)	فناجين 2 أوز كريستال (25/1)	\N	\N	111000002	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	40	130	3.25	280	7	فاركو
ed551f2f-1955-49a3-878c-ed89e510f26c	16 oz glasses (1/20 fill 50 glasses)	كاسات 16 أوز (1/20 تعبئة 50 كاسة)	\N	\N	111000003	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	220	11	300	15	جولف بلاستيك الصناعية
956baf71-ff90-402f-b935-e867d94cc163	200ml cups (1/30 pack of 100)	كاسات 200مل (1/30 ربطة تعبئة 100)	\N	\N	111000004	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	30	72	2.4	120	4	بلاستيك القدس الصناعية التجارية -الاشمر
82b1fd7c-cbea-44a5-9782-dabc4d95bbc8	330 Ashmar cups	كاسات 330 أشمر	\N	\N	111000005	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	80	4	120	6	بلاستيك القدس الصناعية التجارية -الاشمر
3b80ebd7-fadc-456a-807f-de85c30bfa00	8 oz crystal glasses (50/1) with lid	كاسات 8 أوز كريستال (50/1) مع غطاء	\N	\N	111000006	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	180	9	280	14	كرم المصري-سما للتجارة العامة
8d488d89-35a0-4b5a-b3c4-ad16d5c88a99	12 oz Crystal Plastic Cups with Lid	كاسات بلاستيك 12 أوز كريستال مع غطاء	\N	\N	111000009	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	200	10	280	14	جولف بلاستيك الصناعية
e01f482b-cc23-4969-851c-14254f3cf9e5	20 oz Crystal Plastic Cups with Lid	كاسات بلاستيك 20 أوز كريستال مع غطاء	\N	\N	111000010	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	250	12.5	340	17	جولف بلاستيك الصناعية
b3b0d4f6-7571-40ce-853e-097b2491aba2	16 oz Crystal Plastic Cups with Lid	كاسات بلاستيك 16 أوز كريستال مع غطاء	\N	\N	111000036	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	230	11.5	320	16	جولف بلاستيك الصناعية
a34aafb2-8bec-40e6-9702-5f101601e311	180 ml plastic cups	كاسات بلاستيك 180 مل	\N	\N	111000011	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	30	50	1.67	75	2.5	جولف بلاستيك الصناعية
e56f7f49-cffe-46ff-b3da-be293029293a	250 ml plastic cups	كاسات بلاستيك 250 مل	\N	\N	111000012	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	120	6	160	8	بلاستيك القدس الصناعية التجارية -الاشمر
f41da160-9645-4c52-bb0c-0213e0d9288b	350ml plastic cups (50/1) with lid	كاسات بلاستيك 350 مل (50/1) مع غطاء	\N	\N	111000013	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	170	8.5	260	13	زعتر علام -للبلاستيك والنايلون
468d9ddb-9a9b-4d3d-a3d9-69cc5fe81e7e	24 oz popcorn cups (50/1)	كاسات بوشار 24أوز (50/1)	\N	\N	111000014	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	180	9	400	20	جولف بلاستيك الصناعية
7166ebe6-f7a5-48b1-bf72-70dab17e8326	Sim cups 330 ml (40/1)	كاسات سيم 330 مل(40/1)	\N	\N	111000015	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	25	75	3	125	5	حسونة-ايليت لصناعه البلاستيك
22b66cd8-163f-4845-95cb-034429b1ddd8	2 oz cardboard cups	كاسات كرتون 2 أوز	\N	\N	111000016	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	20	1	40	2	جولف بلاستيك الصناعية
27775770-6c00-4e79-8dac-e4cbda048191	6 oz cardboard cups	كاسات كرتون 6 أوز	\N	\N	111000018	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	35	1.75	50	2.5	ابو تبانه
cae20f23-4cc3-4a44-a7ec-c84207ca0904	7 oz (180 g) carton cups	كاسات كرتون 7 أوز (180 غم)	\N	\N	111000019	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	38	1.9	60	3	جولف بلاستيك الصناعية
2fae4348-9bf8-4792-a969-b345e3713899	7 oz (200 g) carton cups	كاسات كرتون 7 أوز (200 غم)	\N	\N	111000020	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	42	2.1	60	3	ابو تبانه
071f4b55-4600-41f4-83b0-aa8b3e2aa48f	7 oz (250 g) carton cups	كاسات كرتون 7 أوز (250 غم)	\N	\N	111000021	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	45	2.25	60	3	ابو تبانه
f5fae4d1-9a04-408b-b95f-aaa0433a0ac7	7oz cardboard cups	كاسات كرتون 7B أوز	\N	\N	111000037	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	38	1.9	50	2.5	ابو تبانه
4a3ba77e-3124-45e7-af8b-6a977cba88a3	8b white cardboard cups	كاسات كرتون 8b أبيض	\N	\N	111000022	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	80	4	100	5	زعتر علام -للبلاستيك والنايلون
84860428-6108-4ba2-bc5a-82a8330079b3	8oz cardboard cups	كاسات كرتون 8b أوز	\N	\N	111000023	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	115	5.75	100	5	تارجت
6a586723-d046-4818-8788-6232892fefc8	9 oz cardboard cups (Sara)	كاسات كرتون 9 اوز (سارة)	\N	\N	111000024	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	62	3.1	100	5	زعتر علام -للبلاستيك والنايلون
aeb26b26-d843-45f6-bb0a-583d829d3af0	9 oz carton cups (Sara) white	كاسات كرتون 9 اوز (سارة) أبيض	\N	\N	111000025	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	62	3.1	100	5	زعتر علام -للبلاستيك والنايلون
56c2a1d7-bdbc-4695-88e2-07396bc59342	9 oz cardboard cups (Target)	كاسات كرتون 9 اوز (تارجيت)	\N	\N	111000026	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	65	3.25	100	5	تارجت
52e86873-38ad-4394-bd34-3b7fcba16f12	4 oz ice cream carton cups (50/1)	كاسات كرتون بوظة 4 أوز)50/1(	\N	\N	111000027	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	120	6	180	9	زعتر علام -للبلاستيك والنايلون
ed47df99-a59d-4f6d-a60f-71b5c48795f5	8 oz ice cream carton cups	كاسات كرتون بوظة 8 أوز	\N	\N	111000028	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	150	7.5	200	10	زعتر علام -للبلاستيك والنايلون
4b496280-4818-4d58-8739-9f83d0e5d179	4 oz cardboard cups	كاسات كرتون 4 أوز	\N	\N	111000029	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	30	1.5	50	2.5	زعتر علام -للبلاستيك والنايلون
3122af0b-59bb-4bee-b712-33a253a6a550	180 ml crystal glasses	كاسات كريستال 180 مل	\N	\N	111000030	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	170	8.5	500	25	جولف بلاستيك الصناعية
0e09db50-bc31-435c-9977-755da15260b9	Drawing cups (40/1)	كاسات مرسم (40/1)	\N	\N	111000031	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	25	90	3.6	125	5	الشروق للتوزيع للتجارة-موسى سكافي
fa196f78-c280-44cf-8c59-0aa9e365e3f0	Popcorn cups (32 oz)	كاسات بوشار (32أوز)	\N	\N	111000032	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	10	220	22	280	28	جولف بلاستيك الصناعية
05085889-2363-4aad-805b-6f5722e228fa	Ashmar cups (350 ml) (1/50)	كاسات أشمر (350 مل) (1/50)	\N	\N	111000034	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	80	4	120	6	بلاستيك القدس الصناعية التجارية -الاشمر
e6e42ef0-fc2f-4d5a-b4be-fe1ea7efe380	Future Cups (300 ml) (50/1)	كاسات المستقبل (300 مل)(50/1)	\N	\N	111000035	\N	كاسات وفناجين (بلاستيك وكرتون)	\N	\N	1110	أدوات مائدة	كمية	PCS	20	180	9	260	13	الشروق للتوزيع للتجارة-موسى سكافي
fe93aabc-f491-432c-a1f4-282c74a29b5e	Large Round Coaster (100/1)	كوستر دائري كبير (100/1)	\N	\N	111100001	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	12	144	12	300	25	فادي الزغير-المحيط الازرق
62b3ee25-afc5-43f5-b844-fe29ddb2b0f8	cup coaster	كوستر فنجان	\N	\N	111100002	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	40	85	2.13	200	5	فادي الزغير-المحيط الازرق
97c80062-a958-4eff-8a16-a783cb21d6b9	Large Square Coaster (100/1)	كوستر مربع كبير (100/1)	\N	\N	111100003	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	12	144	12	300	25	فادي الزغير-المحيط الازرق
7b3ca6a5-8d8c-4a1e-a549-712ac4792a2e	Plastic movements	حراكات بلاستيك	\N	\N	111100004	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	12	216	18	336	28	جولف بلاستيك الصناعية
c708bed0-b8cf-4774-80b8-14e8ebd082bd	Wood movements (100)	حراكات خشب (100)	\N	\N	111100005	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	9751e859-f86b-4f8e-9910-872759456895	1111	أدوات مائدة	كمية	PCS	100	180	1.8	400	4	حسن عوواده-محلات ليان للمواد للبلاستيكية
8e4f2d43-27c4-4a12-8659-64cbdad3ea03	Wood movers (1000)	حراكات خشب (1000)	\N	\N	111100006	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	9751e859-f86b-4f8e-9910-872759456895	1111	أدوات مائدة	كمية	PCS	12	156	13	240	20	حسن عوواده-محلات ليان للمواد للبلاستيكية
89d21a3e-06bd-4402-8997-ecbdc9652583	Titanic wood movements	حراكات خشب تايتنك	\N	\N	111100007	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	46242857-67e8-4da9-8061-64d245592fa2	1111	أدوات مائدة	كمية	PCS	10	230	23	350	35	حامد ناصر الدين
8be65ea6-a0eb-4396-87e2-d1d96835a406	9 oz Sano Cap (50/1)	غطاء 9 أوز سانو (50/1)	\N	\N	111100009	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	20	70	3.5	100	5	كرم المصري-سما للتجارة العامة
2019fa87-1c72-4952-8f36-214a629bb916	9 oz golf cover (100/1)	غطاء 9 اوز جولف (100/1)	\N	\N	111100010	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	10	80	8	116	11.6	جولف بلاستيك الصناعية
00f9be70-2012-4067-ac42-d784c9c0c606	12ml black coated lozenge (1/200)	مصاص 12مل مغلف اسود (1/200)	\N	\N	111100012	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	20	180	9	300	15	زعتر علام -للبلاستيك والنايلون
c40674f3-427c-406c-b775-dabb9b978944	10ml Hassouna Cocktail Sucker	مصاص 10مل كوكتيل حسونة	\N	\N	111100013	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	40	115	2.88	200	5	حسونة-ايليت لصناعه البلاستيك
ed8df2c2-80da-4e6c-be87-edf342c7a1bc	12 ml lozenge (1/100)	مصاص 12 مل (1/100)	\N	\N	111100014	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	40	125	3.13	240	6	حسونة-ايليت لصناعه البلاستيك
45f228b4-6339-441d-a6c0-200154855998	8 ml lozenge (1/100)	مصاص 8 مل (1/100)	\N	\N	111100015	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	b50e9e0c-24de-4695-938d-e120cff2f25e	1111	أدوات مائدة	كمية	PCS	40	80	2	160	4	حسونه لمواد البناء
57c0bfe9-70d2-4fec-8004-6ba4ba2490ba	Black lollipop 8ml (100 pack)	مصاص أسود 8مل (ربطة /100)	\N	\N	111100016	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	40	80	2	160	4	حسونة-ايليت لصناعه البلاستيك
a09df2f6-ecc5-4353-ab80-f780ee77d290	Spring Sucker (1/100)	مصاص زمبرك (1/100)	\N	\N	111100018	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	50	175	3.5	5	5	جولف بلاستيك الصناعية
b3e9a77a-fc0c-485e-83ee-7c1f2b06ed6b	6ml regular lozenge (1/200)	مصاص 6مل عادي (1/200)	\N	\N	111100019	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	20	28	1.4	60	3	حسونة-ايليت لصناعه البلاستيك
03b2f8f5-9e37-414f-9063-e5f8757222c3	12ml Cocktail Sucker (1/100)	مصاص 12مل كوكتيل (1/100)	\N	\N	111100021	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	40	125	3.13	240	6	بلاستيك القدس الصناعية التجارية -الاشمر
d39e5d44-00d2-4fca-a2d5-45ddc1f25237	Curved sucker (1/400)	مصاص معكوف (1/400)	\N	\N	111100023	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	24	130	5.42	192	8	حسونة-ايليت لصناعه البلاستيك
39301b78-01c7-48ed-b0ba-1958568c8426	Curved lollipop (250*1)	مصاص معكوف (250*1)	\N	\N	111100024	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	20	60	3	87	4.35	حسونة-ايليت لصناعه البلاستيك
ef068a20-61ab-409a-9d1f-de00e5805225	Wrapped lollipop (100/1)	مصاص مغلف (100/1)	\N	\N	111100025	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	100	350	3.5	500	5	كرم المصري-سما للتجارة العامة
86ef7aab-4f75-413e-b44b-8cc13888cfd4	Coated lollipop (250/1)	مصاص مغلف (250/1)	\N	\N	111100026	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	20	180	9	260	13	كرم المصري-سما للتجارة العامة
e9bfb551-da0a-4030-87c2-3c4088e1c1b1	White coated lollipop (1/250)	مصاص مغلف أبيض (1/250)	\N	\N	111100027	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	40	350	8.75	520	13	كرم المصري-سما للتجارة العامة
697555b3-c957-44eb-84b7-02c538691539	Black coated lollipop	مصاص مغلف أسود	\N	\N	111100028	\N	مستلزمات كاسات (أغطية، مصاص، حراكات)	\N	\N	1111	أدوات مائدة	كمية	PCS	20	150	7.5	200	10	كرم المصري-سما للتجارة العامة
377086e2-1b5c-4cfd-b33e-db5a787ad7a7	10 liter bucket	سطل 10 لتر	\N	\N	120100001	\N	دلاء وأوعية تنظيف	\N	\N	1201	أدوات تنظيف عامة	كمية	PCS	25	87.5	3.5	125	5	بلاستيك القدس الصناعية التجارية -الاشمر
268433f6-2506-4f4b-be01-1d8e6b5279d3	15 liter bucket	سطل 15 لتر	\N	\N	120100002	\N	دلاء وأوعية تنظيف	\N	\N	1201	أدوات تنظيف عامة	كمية	PCS	15	97.5	6.5	150	10	بلاستيك القدس الصناعية التجارية -الاشمر
0921cb8a-aa1e-4de8-9f17-80a34709e037	graduated lip bucket	سطل مدرج شفة	\N	\N	120100004	\N	دلاء وأوعية تنظيف	\N	\N	1201	أدوات تنظيف عامة	كمية	PCS	15	97.5	6.5	150	10	بلاستيك القدس الصناعية التجارية -الاشمر
632a5f52-1124-4267-966d-88303519341c	Black microfiber towels (3/1)	فوط أسود مايكروفايبر (3/1)	\N	\N	120200001	\N	فوط ومماسح تنظيف	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1202	أدوات تنظيف عامة	كمية	PCS	120	660	5.5	1200	10	عريب جرادات-سكاي سيرفس
882d24c6-f160-4704-90ed-500af8860342	Arix Magic Pads (1/4)	فوط سحرية أريكس (1/4)	\N	\N	120200003	\N	فوط ومماسح تنظيف	\N	7441d52a-a07b-4e3c-9892-446f27ebdd70	1202	أدوات تنظيف عامة	كمية	PCS	12	150	12.5	180	15	جينتريد-gentrade
5eacf2a4-d356-4404-9ae3-3e59d936c05e	Magic Rose Pads (4/1)	فوط سحرية روز (4/1)	\N	\N	120200004	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	48	240	5	288	6	تارجت
e5f29376-969b-458b-985d-c108e6d8da20	Mobtex Magic Pads (4/1)	فوط سحرية موبتكس (4/1)	\N	\N	120200006	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	24	65	2.71	96	4	موبتكس
49ab029f-7e48-4e4f-a2b4-368ebc0365f5	Arix Cotton Dust Pads (3/1)	فوط غبرة قطنية اريكس (3/1)	\N	\N	120200007	\N	فوط ومماسح تنظيف	\N	7441d52a-a07b-4e3c-9892-446f27ebdd70	1202	أدوات تنظيف عامة	كمية	PCS	24	245	10.21	360	15	جينتريد-gentrade
b8faa97c-322d-4972-ad6d-b9d033ed3ad5	butterfly towels	فوط فراشة	\N	\N	120200008	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	24	65	2.71	96	4	تارجت
92694805-945c-45e8-8cac-ab4baf3ce358	Mobtex Cotton Pads (3/1)	فوط قطنية موبتكس (3/1)	\N	\N	120200010	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	40	45	1.13	60	1.5	موبتكس
a9337e29-7c59-41b5-b44a-955d1e1d09b5	black mops	مماسح اسود	\N	\N	120200011	\N	فوط ومماسح تنظيف	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1202	أدوات تنظيف عامة	كمية	PCS	60	50	0.83	72	1.2	الانوار-ابو ععفيفة
3aa417db-65b9-43f1-8517-7c3103158f50	Triple wipers	مماسح ثلاثي	\N	\N	120200012	\N	فوط ومماسح تنظيف	\N	a51df474-5f00-4c87-968f-cec23db5d6ff	1202	أدوات تنظيف عامة	كمية	PCS	24	140	5.83	240	10	واصف البزار
d77645b6-f774-4eb8-9786-c701627326e2	Magic mops (fresh)	مماسح سحرية (فريش)	\N	\N	120200013	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	36	162	4.5	360	10	كرم المصري-سما للتجارة العامة
06449825-2155-488c-9413-e0ed247f8176	yellow mop	ممسحة أصفر	\N	\N	120200014	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	60	50	0.83	90	1.5	موبتكس
3946415d-4f1c-4810-b249-1ea2e186f90f	Rose Magic Mop	ممسحة سحرية روز	\N	\N	120200015	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	48	240	5	288	6	تارجت
14d0fb89-f406-48a7-8dcf-4ed92bac1a61	Magic Butterfly Mop	ممسحة سحرية فراشة	\N	\N	120200016	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	24	65	2.71	96	4	تارجت
d5d15abe-702e-4bdc-91ed-e176ec043fef	Platinum Towels (Cars)	فوط بلاتينيوم (سيارات)	\N	\N	120200017	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	48	168	3.5	240	5	جولف بلاستيك الصناعية
24384197-3841-4476-95cf-155dbc8d52ac	Panda towels and mops	فوط ومماسح باندا	\N	\N	120200018	\N	فوط ومماسح تنظيف	\N	\N	1202	أدوات تنظيف عامة	كمية	PCS	36	150	4.17	216	6	كرم المصري-سما للتجارة العامة
c84c001e-31fc-4c7b-9400-e4428e2c0c48	40cm plastic scrapers	قشاطات بلاستيك 40سم	\N	\N	120300001	\N	قشاطات (أرضيات وزجاج)	\N	\N	1203	أدوات تنظيف عامة	كمية	PCS	48	91.2	1.9	144	3	تارجت
32b33b9e-abf1-4fdf-81ea-f6852a2598c9	60 cm iron scraper	قشاطة حديد 60 سم	\N	\N	120300002	\N	قشاطات (أرضيات وزجاج)	\N	9751e859-f86b-4f8e-9910-872759456895	1203	أدوات تنظيف عامة	كمية	PCS	48	240	5	384	8	حسن عوواده-محلات ليان للمواد للبلاستيكية
c0eba473-4b09-4bc0-8f0b-96a25fd66756	Mobtex 40cm scraper with jack	قشاطة موبتكس 40سم مع جك	\N	\N	120300003	\N	قشاطات (أرضيات وزجاج)	\N	\N	1203	أدوات تنظيف عامة	كمية	PCS	24	95	3.96	144	6	موبتكس
92f19a3e-3741-4ce4-be26-4c0e3bcfb3df	45cm black scraper	قشاطة 45سم أسود	\N	\N	120300004	\N	قشاطات (أرضيات وزجاج)	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1203	أدوات تنظيف عامة	كمية	PCS	20	120	6	160	8	الانوار-ابو ععفيفة
2c980a72-f77d-4093-a087-2282c1ab8c9d	50cm iron scraper	قشاطة 50سم حديد	\N	\N	120300005	\N	قشاطات (أرضيات وزجاج)	\N	\N	1203	أدوات تنظيف عامة	كمية	PCS	24	108	4.5	168	7	تارجت
36236d5b-9de5-4f81-8f20-bc4bb3d41a38	50cm scraper with jack	قشاطة 50سم مع جك	\N	\N	120300006	\N	قشاطات (أرضيات وزجاج)	\N	\N	1203	أدوات تنظيف عامة	كمية	PCS	24	96	4	168	7	موبتكس
fc0d84f8-784c-45a6-a952-02092a0a8fbf	55cm black scraper	قشاطة 55سم أسود	\N	\N	120300007	\N	قشاطات (أرضيات وزجاج)	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1203	أدوات تنظيف عامة	كمية	PCS	20	105	5.25	200	10	الانوار-ابو ععفيفة
d32e1c7b-69d4-4bb8-a0b9-67a2591f5180	55cm two-skin scouring pad	قشاطة 55سم جلدتين	\N	\N	120300009	\N	قشاطات (أرضيات وزجاج)	\N	9751e859-f86b-4f8e-9910-872759456895	1203	أدوات تنظيف عامة	كمية	PCS	48	168	3.5	384	8	حسن عوواده-محلات ليان للمواد للبلاستيكية
b8cc4441-9ca3-44f4-8d37-8379db30049c	60cm iron scraper (toothed entry)	قشاطة 60سم حديد (مدخل مسنن)	\N	\N	120300010	\N	قشاطات (أرضيات وزجاج)	\N	\N	1203	أدوات تنظيف عامة	كمية	PCS	48	240	5	384	8	موبتكس
66152b4a-15ad-4d0a-8abe-40e92fb69a0c	60cm iron scraper	قشاطة 60سم حديد	\N	\N	120300011	\N	قشاطات (أرضيات وزجاج)	\N	9751e859-f86b-4f8e-9910-872759456895	1203	أدوات تنظيف عامة	كمية	PCS	48	240	5	384	8	حسن عوواده-محلات ليان للمواد للبلاستيكية
4bb3a202-bf29-4609-90db-76821deda4bf	60cm scraper with jack	قشاطة 60سم مع جك	\N	\N	120300012	\N	قشاطات (أرضيات وزجاج)	\N	\N	1203	أدوات تنظيف عامة	كمية	PCS	24	130	5.42	192	8	موبتكس
c0a0b882-b22e-4313-b3b7-5937165e894d	Iron sink scraper (1*100)	قشاطة مجلى حديد (1*100)	\N	\N	120300013	\N	قشاطات (أرضيات وزجاج)	\N	9751e859-f86b-4f8e-9910-872759456895	1203	أدوات تنظيف عامة	كمية	PCS	100	350	3.5	400	4	حسن عوواده-محلات ليان للمواد للبلاستيكية
f742fe8d-f221-46ee-9634-d578b56074a3	Silicone sink scouring pad	قشاطة مجلى سيليكون	\N	\N	120300014	\N	قشاطات (أرضيات وزجاج)	\N	\N	1203	أدوات تنظيف عامة	كمية	PCS	24	38.4	1.6	72	3	موبتكس
7471eb10-61f3-4350-b03c-9f75e43b126b	Scrub with sponge	قشاطة مع اسفنج	\N	\N	120300015	\N	قشاطات (أرضيات وزجاج)	\N	\N	1203	أدوات تنظيف عامة	كمية	PCS	24	60	2.5	120	5	جولف بلاستيك الصناعية
7dd687ea-5646-4469-9acb-bd089c116152	broom with broom	قشاطة مع مكنسة	\N	\N	120300016	\N	قشاطات (أرضيات وزجاج)	\N	\N	1203	أدوات تنظيف عامة	كمية	PCS	24	60	2.5	120	5	جولف بلاستيك الصناعية
2f61ea06-7a7d-480f-8f70-28059f74ee43	Iron wire (5/1)	سلكة حديد (5/1)	\N	\N	120400001	\N	ليف وسلك جلي	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1204	أدوات تنظيف عامة	كمية	PCS	150	225	1.5	600	4	الانوار-ابو ععفيفة
ff6975b8-214d-43b7-a821-bc7b14704010	coarse wheel wire	سلكة عجل خشنة	\N	\N	120400002	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	5	12.5	2.5	25	5	الجردانة التجارية الصناعية
c3029f2a-4f5a-481f-b80c-c1e39124498d	soft wheel wire	سلكة عجل ناعمة	\N	\N	120400003	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	5	12.5	2.5	25	5	الجردانة التجارية الصناعية
40ab2339-54b6-46ea-8af7-6e29f13a29a7	Kebab wire	سلكة كباب	\N	\N	120400004	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	30	75	2.5	150	5	الجردانة التجارية الصناعية
46b62398-870a-4504-8902-74048887b5e9	Adam deodorant	مزيل عرق ادم	\N	\N	170500004	\N	مزيلات عرق	\N	\N	1705	عناية شخصية	كمية	PCS	12	96	8	120	10	ابو ثائر
67ba3fb4-e302-4c15-b061-163335ed54a7	Liv (5/1) Turkish Climax	ليف (5/1) كلايمكس تركي	\N	\N	120400007	\N	ليف وسلك جلي	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	1204	أدوات تنظيف عامة	كمية	PCS	48	40	0.83	96	2	جونسون كلين - نشأت برناط-شركة الزين
3368d064-9189-4376-b722-e0835187f4bf	Leaf (1/5)	ليف (1/5)	\N	\N	120400008	\N	ليف وسلك جلي	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	1204	أدوات تنظيف عامة	كمية	PCS	24	30	1.25	48	2	جونسون كلين - نشأت برناط-شركة الزين
2fbe3587-b34e-45d8-b2ab-c06374757099	Leaf Polina Large Size (1/8)	ليف بولينا حجم كبير (1/8)	\N	\N	120400009	\N	ليف وسلك جلي	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1204	أدوات تنظيف عامة	كمية	PCS	25	150	6	375	15	الانوار-ابو ععفيفة
676c8367-ba7e-46c6-aab6-52219ab5d48b	binary fiber	ليف ثنائي	\N	\N	120400010	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	100	230	2.3	400	4	فادي الزغير-المحيط الازرق
2582b561-1e80-4320-af71-28f70ea7dd11	Five-piece cleaning cloth (Jardana)	ليف جلي خمسات (جردانة)	\N	\N	120400011	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	20	25	1.25	50	2.5	الجردانة التجارية الصناعية
b5b54819-0e19-4226-a262-00a1234d71c1	Live Fiverrix	ليف خمسات أريكس	\N	\N	120400012	\N	ليف وسلك جلي	\N	7441d52a-a07b-4e3c-9892-446f27ebdd70	1204	أدوات تنظيف عامة	كمية	PCS	14	70	5	98	7	جينتريد-gentrade
2b225c48-7d91-42df-b522-2307daf451b3	Leaf five Awawdeh	ليف خمسات عواودة	\N	\N	120400013	\N	ليف وسلك جلي	\N	9751e859-f86b-4f8e-9910-872759456895	1204	أدوات تنظيف عامة	كمية	PCS	20	25	1.25	50	2.5	حسن عوواده-محلات ليان للمواد للبلاستيكية
58efe40e-aedc-4007-b539-971afdda44d9	Live Score Power	ليف سكور باور	\N	\N	120400014	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	200	550	2.75	800	4	زعتر علام -للبلاستيك والنايلون
47bd2169-43b1-4dab-a61e-3364f32ba5ee	Magic Leaf (1/3) White	ليف سحرية (1/3) أبيض	\N	\N	120400015	\N	ليف وسلك جلي	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1204	أدوات تنظيف عامة	كمية	PCS	12	72	6	120	10	الهلال والنجمة الحديثة
69ef36c9-78db-4fc5-b520-69be14ce9c2d	Magic coarse loofah (3/1)	ليف سحرية خشن (3/1)	\N	\N	120400016	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	144	504	3.5	864	6	الشروق للتوزيع للتجارة-موسى سكافي
5618c3f4-e7d3-4dd3-ad5f-1687388aa835	Soft Magic Loofah (3/1)	ليف سحرية ناعم (3/1)	\N	\N	120400017	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	144	504	3.5	864	6	الشروق للتوزيع للتجارة-موسى سكافي
aa21a1cb-39b8-4fd8-bc5c-ed05d2379441	Big Leaf Paulina (4/1)	ليف كبير بولينا (4/1)	\N	\N	120400018	\N	ليف وسلك جلي	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1204	أدوات تنظيف عامة	كمية	PCS	36	162	4.5	360	10	الانوار-ابو ععفيفة
8be46926-763e-4418-acec-9022fd137687	Leaf palm	ليف كف	\N	\N	120400019	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	36	21	0.58	36	1	الجردانة التجارية الصناعية
b5130f71-968c-4b90-b25a-e894d32622fe	gilded leaf	ليف مذهب	\N	\N	120400021	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	36	14.5	0.4	36	1	موبتكس
ee23a3d5-596a-4041-95da-885ccfe9e77f	Score Power Scourer (Quad)	ليفة جلي سكور باور (رباعي)	\N	\N	120400022	\N	ليف وسلك جلي	\N	\N	1204	أدوات تنظيف عامة	كمية	PCS	120	360	3	600	5	زعتر علام -للبلاستيك والنايلون
7c8454d2-3e4a-415f-82d9-43d3641456f6	iron scraper	مجرود حديد	\N	\N	120500001	\N	مجاريد	\N	\N	1205	أدوات تنظيف عامة	كمية	PCS	12	40	3.33	60	5	موبتكس
9c644554-a75c-42c1-9b06-35693d38a906	stainless steel scoop	مجرود ستانلس	\N	\N	120500002	\N	مجاريد	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1205	أدوات تنظيف عامة	كمية	PCS	80	340	4.25	560	7	الانوار-ابو ععفيفة
c2c3103e-3091-4fa7-83a7-05c6d17258fb	A hoe with a leather strap	مجرود مع جلدة	\N	\N	120500003	\N	مجاريد	\N	\N	1205	أدوات تنظيف عامة	كمية	PCS	12	18	1.5	36	3	جولف بلاستيك الصناعية
cbac6dba-f9d1-4895-b26b-af335e63ef1b	Black bathroom brush (stainless steel stick)	فرشاة حمام أسود (عصا ستانلس)	\N	\N	120600001	\N	مكانس وفراشي تنظيف	\N	9751e859-f86b-4f8e-9910-872759456895	1206	أدوات تنظيف عامة	كمية	PCS	60	210	3.5	360	6	حسن عوواده-محلات ليان للمواد للبلاستيكية
81e6e5fc-4c5c-4587-9f2c-e5132fd32965	Toilet brush (1/160)	فرشاة مرحاض (1/160)	\N	\N	120600002	\N	مكانس وفراشي تنظيف	\N	9751e859-f86b-4f8e-9910-872759456895	1206	أدوات تنظيف عامة	كمية	PCS	160	400	2.5	560	3.5	حسن عوواده-محلات ليان للمواد للبلاستيكية
0f8b6f40-9441-43f2-83e1-3438ee2270e3	iron brush	فرشاة مكوى	\N	\N	120600003	\N	مكانس وفراشي تنظيف	\N	9751e859-f86b-4f8e-9910-872759456895	1206	أدوات تنظيف عامة	كمية	PCS	48	86.4	1.8	144	3	حسن عوواده-محلات ليان للمواد للبلاستيكية
a79eef04-c465-41b5-9d91-5508c2c696cb	Lamama carpet (3 eyes)	لمامة سجاد (3 عيون)	\N	\N	120600004	\N	مكانس وفراشي تنظيف	\N	9751e859-f86b-4f8e-9910-872759456895	1206	أدوات تنظيف عامة	كمية	PCS	6	15	2.5	24	4	حسن عوواده-محلات ليان للمواد للبلاستيكية
ca94d883-3116-4c67-bfd6-5c252d271f20	Large carpet rug (6 eyes)	لمامة سجاد كبير (6 عيون)	\N	\N	120600005	\N	مكانس وفراشي تنظيف	\N	9751e859-f86b-4f8e-9910-872759456895	1206	أدوات تنظيف عامة	كمية	PCS	48	216	4.5	384	8	حسن عوواده-محلات ليان للمواد للبلاستيكية
c503fd52-732a-41c1-b333-77cec3ff6e1e	Black brooms are confused	مكانس أسود مشوش	\N	\N	120600006	\N	مكانس وفراشي تنظيف	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1206	أدوات تنظيف عامة	كمية	PCS	12	30	2.5	48	4	الهلال والنجمة الحديثة
4d1c8c2d-671e-4b04-ac8f-98596afd7083	Black rough brooms	مكانس خشنة أسود	\N	\N	120600007	\N	مكانس وفراشي تنظيف	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1206	أدوات تنظيف عامة	كمية	PCS	12	28	2.33	48	4	الهلال والنجمة الحديثة
dbe58c6f-d670-4554-b8dc-ffdddd307df1	Cinderella's brooms	مكانس سندريلا	\N	\N	120600008	\N	مكانس وفراشي تنظيف	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1206	أدوات تنظيف عامة	كمية	PCS	12	40	3.33	72	6	الهلال والنجمة الحديثة
85bf766a-73bf-45df-8dd2-74cb1c019f8f	Rubis soap	صابون روبيس	\N	\N	210200003	\N	صابون سائل ورغوة للأيدي	\N	\N	2102	مواد تنظيف	كمية	PCS	96	72	0.75	96	1	تارجت
5e271817-dc59-4f06-811f-4badbc021c1a	Schrobel brooms (plastic base)	مكانس شروبل (قاعدة بلاستيك)	\N	\N	120600009	\N	مكانس وفراشي تنظيف	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1206	أدوات تنظيف عامة	كمية	PCS	12	84	7	120	10	الهلال والنجمة الحديثة
81bb1cc2-5af0-4420-a308-87603697401c	Flora brooms	مكانس فلورا	\N	\N	120600010	\N	مكانس وفراشي تنظيف	\N	9751e859-f86b-4f8e-9910-872759456895	1206	أدوات تنظيف عامة	كمية	PCS	24	103	4.29	144	6	حسن عوواده-محلات ليان للمواد للبلاستيكية
3fdcae30-d78d-436d-ad3c-22787b8e133a	soft brooms	مكانس ناعمة	\N	\N	120600011	\N	مكانس وفراشي تنظيف	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1206	أدوات تنظيف عامة	كمية	PCS	12	23	1.92	48	4	الهلال والنجمة الحديثة
3d4d02ad-8f5e-4cb3-8907-1fb02b75532f	carpet sweeper	مكنسة سجاد	\N	\N	120600012	\N	مكانس وفراشي تنظيف	\N	9751e859-f86b-4f8e-9910-872759456895	1206	أدوات تنظيف عامة	كمية	PCS	24	60	2.5	96	4	حسن عوواده-محلات ليان للمواد للبلاستيكية
d55ab9ce-d036-4d79-b377-7dd161e278c2	Street broom (30cm wooden base)	مكنسة شارع (قاعدة خشب 30سم)	\N	\N	120600013	\N	مكانس وفراشي تنظيف	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1206	أدوات تنظيف عامة	كمية	PCS	16	120	7.5	240	15	الهلال والنجمة الحديثة
eab39347-56ba-4c59-8d13-bd27a709b487	Street broom (40cm wooden base)	مكنسة شارع (قاعدة خشب 40سم)	\N	\N	120600014	\N	مكانس وفراشي تنظيف	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1206	أدوات تنظيف عامة	كمية	PCS	8	80	10	160	20	الهلال والنجمة الحديثة
570de4a7-01a4-4516-89e4-fc17a5217626	Helen's broom	مكنسة هيلين	\N	\N	120600015	\N	مكانس وفراشي تنظيف	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1206	أدوات تنظيف عامة	كمية	PCS	12	45	3.75	96	8	الهلال والنجمة الحديثة
0e09a6f4-64aa-4ab6-964f-06ffd4e98500	Platinum Facility	منشة بلاتينيوم	\N	\N	120600016	\N	مكانس وفراشي تنظيف	\N	\N	1206	أدوات تنظيف عامة	كمية	PCS	200	700	3.5	1000	5	جولف بلاستيك الصناعية
031e933f-33c1-4d9e-94b3-991c19bf0872	ostrich feather fluff	منشة ريش نعام	\N	\N	120600017	\N	مكانس وفراشي تنظيف	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1206	أدوات تنظيف عامة	كمية	PCS	150	1500	10	2250	15	الانوار-ابو ععفيفة
797dfa76-b0b6-48f9-8eef-38746d3d8341	Iron stick (140 cm)	عصا حديد (140سم)	\N	\N	120700001	\N	عصي ومقابض أدوات تنظيف	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1207	أدوات تنظيف عامة	كمية	PCS	24	48	2	96	4	الهلال والنجمة الحديثة
e0281777-5a9e-4ed2-95ad-24daf3ecf025	wooden stick (1.5 m)	عصا خشب (1.5 متر)	\N	\N	120700002	\N	عصي ومقابض أدوات تنظيف	\N	\N	1207	أدوات تنظيف عامة	كمية	PCS	25	60	2.4	100	4	موبتكس
c07eb768-e2db-42f0-9dca-3deef79f8b4d	Painted wooden stick (1.5 m)	عصا خشب مدهون (1.5 متر)	\N	\N	120700003	\N	عصي ومقابض أدوات تنظيف	\N	\N	1207	أدوات تنظيف عامة	كمية	PCS	25	62	2.48	100	4	موبتكس
cc3a2b78-8661-4edc-b1f1-6615d426d618	short stick	عصا قصيرة	\N	\N	120700004	\N	عصي ومقابض أدوات تنظيف	\N	\N	1207	أدوات تنظيف عامة	كمية	PCS	25	35	1.4	62.5	2.5	موبتكس
82fb00d9-9cd0-4134-8560-574c6508d19c	Toilet Plunger	خفاضة (مكبس هواء للمرحاض)	\N	\N	120700005	\N	عصي ومقابض أدوات تنظيف	\N	9751e859-f86b-4f8e-9910-872759456895	1207	أدوات تنظيف عامة	كمية	PCS	60	210	3.5	420	7	حسن عوواده-محلات ليان للمواد للبلاستيكية
fa8d1bf4-9ed8-4f8c-bfc4-384ba727fff9	International Soap Boxes (500ml)	علب صابون دولي (500مل)	\N	\N	130100001	\N	موزعات صابون سائل ورغوة	\N	9751e859-f86b-4f8e-9910-872759456895	1301	أجهزة وموزعات	كمية	PCS	30	300	10	450	15	حسن عوواده-محلات ليان للمواد للبلاستيكية
dc0f96e8-9b9b-44d2-a923-8a8e4b29ac71	Hand machine (650)	ماكنة أيدي (650)	\N	\N	130100002	\N	موزعات صابون سائل ورغوة	\N	9751e859-f86b-4f8e-9910-872759456895	1301	أجهزة وموزعات	كمية	PCS	24	600	25	840	35	حسن عوواده-محلات ليان للمواد للبلاستيكية
c979810d-3050-49f4-9614-07b88332280a	International hand machine (liter)	ماكنة أيدي دولي (لتر)	\N	\N	130100003	\N	موزعات صابون سائل ورغوة	\N	9751e859-f86b-4f8e-9910-872759456895	1301	أجهزة وموزعات	كمية	PCS	24	240	10	480	20	حسن عوواده-محلات ليان للمواد للبلاستيكية
3bde3bd8-1b63-40f1-880c-a8565e806503	Soft Line Hand Machine (Liter)	ماكنة أيدي سوفت لاين (لتر)	\N	\N	130100004	\N	موزعات صابون سائل ورغوة	\N	9751e859-f86b-4f8e-9910-872759456895	1301	أجهزة وموزعات	كمية	PCS	24	360	15	600	25	حسن عوواده-محلات ليان للمواد للبلاستيكية
050b0a3e-4bb7-480f-9668-8a8ce7b728f0	Vialli Hand Wash (500ml Clear)	ماكنة أيدي فيالي (500مل شفاف)	\N	\N	130100005	\N	موزعات صابون سائل ورغوة	\N	9751e859-f86b-4f8e-9910-872759456895	1301	أجهزة وموزعات	كمية	PCS	40	400	10	1000	25	حسن عوواده-محلات ليان للمواد للبلاستيكية
8d8788f7-c0e0-4529-8f25-4d55c4ec2e83	Flow Soft Hand Liquid Machine (500ml)	ماكنة سائل أيدي فلو سوفت (500مل)	\N	\N	130100006	\N	موزعات صابون سائل ورغوة	\N	9751e859-f86b-4f8e-9910-872759456895	1301	أجهزة وموزعات	كمية	PCS	24	216	9	360	15	حسن عوواده-محلات ليان للمواد للبلاستيكية
8cccb71a-a04b-4765-8967-5996e53eba15	Hand Liquid Machine (650ml)	ماكنة سائل أيدي (650مل)	\N	\N	130100007	\N	موزعات صابون سائل ورغوة	\N	9751e859-f86b-4f8e-9910-872759456895	1301	أجهزة وموزعات	كمية	PCS	24	360	15	600	25	حسن عوواده-محلات ليان للمواد للبلاستيكية
eaca4957-8e36-47dc-bc2d-d57a800ba810	Flora Foam Machine (700ml)	ماكنة فوم فلورا (700مل)	\N	\N	130100008	\N	موزعات صابون سائل ورغوة	\N	9751e859-f86b-4f8e-9910-872759456895	1301	أجهزة وموزعات	كمية	PCS	24	600	25	1080	45	حسن عوواده-محلات ليان للمواد للبلاستيكية
3952f6fa-b63a-4934-b9a9-07d1f462a045	Stainless steel hand sanitizer machine	ماكنة سائل ايدي ستانلس	\N	\N	130100009	\N	موزعات صابون سائل ورغوة	\N	\N	1301	أجهزة وموزعات	كمية	PCS	12	780	65	1140	95	فاركو
c1118fdc-4c70-461a-af13-f0f4b701d6dc	Foam machine (700ml)	ماكنة فوم (700مل)	\N	\N	130100010	\N	موزعات صابون سائل ورغوة	\N	9751e859-f86b-4f8e-9910-872759456895	1301	أجهزة وموزعات	كمية	PCS	24	600	25	1080	45	حسن عوواده-محلات ليان للمواد للبلاستيكية
efe185a2-d848-4f21-8af6-be71feb68580	Roll-up foam machine	ماكنة فوم رولوباك	\N	\N	130100013	\N	موزعات صابون سائل ورغوة	\N	\N	1301	أجهزة وموزعات	كمية	PCS	1	45	45	65	65	فاركو
395f67c6-7281-4237-b410-11d48d3f653b	Kimberley foam machine	ماكنة فوم كمبرلي	\N	\N	130100014	\N	موزعات صابون سائل ورغوة	\N	\N	1301	أجهزة وموزعات	كمية	PCS	1	65	65	95	95	العابودي
f9a25958-de81-4f86-8a73-360e68e69cfe	Spira device	سبيرا جهاز	\N	\N	130200001	\N	أجهزة طارد الحشرات	\N	\N	1302	أجهزة وموزعات	كمية	PCS	24	336	14	480	20	سبل للتسويق والتوزيع
7c9a2ff4-8b57-413c-8d1b-03611495fea1	Spira machine with discs	ماكنة سبيرا مع أقراص	\N	\N	130200002	\N	أجهزة طارد الحشرات	\N	\N	1302	أجهزة وموزعات	كمية	PCS	24	336	14	480	20	سبل للتسويق والتوزيع
078ed164-587e-4b53-a913-162eb315603b	Spira machine with liquid	ماكنة سبيرا مع سائل	\N	\N	130200003	\N	أجهزة طارد الحشرات	\N	\N	1302	أجهزة وموزعات	كمية	PCS	24	384	16	480	20	سبل للتسويق والتوزيع
436afb80-5ccf-4130-975f-38525116e6da	Industrial iron roll holder	حامل رول صناعي حديد	\N	\N	130300001	\N	موزعات محارم تنشيف	\N	\N	1303	أجهزة وموزعات	كمية	PCS	8	280	35	440	55	كرم المصري-سما للتجارة العامة
073a39d6-f5b2-4b53-ade3-a8a0c98df988	Heavy Duty Industrial Roll Holder	حامل رول صناعي حديد ثقيل	\N	\N	130300002	\N	موزعات محارم تنشيف	\N	\N	1303	أجهزة وموزعات	كمية	PCS	10	350	35	550	55	كرم المصري-سما للتجارة العامة
fa252d88-b92c-46fc-964b-105734483e1b	Industrial bone roll holder	حامل رول صناعي عظم	\N	\N	130300003	\N	موزعات محارم تنشيف	\N	46242857-67e8-4da9-8061-64d245592fa2	1303	أجهزة وموزعات	كمية	PCS	3	405	135	540	180	حامد ناصر الدين
4eac47de-fbaa-444d-91f1-7ce75beaa704	Tass head machine (200)	ماكنة تاس راس (200)	\N	\N	130300004	\N	موزعات محارم تنشيف	\N	9751e859-f86b-4f8e-9910-872759456895	1303	أجهزة وموزعات	كمية	PCS	12	180	15	420	35	حسن عوواده-محلات ليان للمواد للبلاستيكية
b30a451f-750a-491a-a30c-c81833dab858	Tass head machine (300)	ماكنة تاس راس (300)	\N	\N	130300005	\N	موزعات محارم تنشيف	\N	9751e859-f86b-4f8e-9910-872759456895	1303	أجهزة وموزعات	كمية	PCS	12	300	25	540	45	حسن عوواده-محلات ليان للمواد للبلاستيكية
7eea2e26-7c2f-4aee-8481-a998d68cc614	Stainless steel head taas machine (300)	ماكنة تاس راس ستانلس (300)	\N	\N	130300006	\N	موزعات محارم تنشيف	\N	\N	1303	أجهزة وموزعات	كمية	PCS	1	45	45	100	100	حسونة-ايليت لصناعه البلاستيك
fdeba2cf-b8b5-451e-9c37-01cdfd582201	Plastic roll drying machine	ماكنة رول تنشيف بلاستيك	\N	\N	130300007	\N	موزعات محارم تنشيف	\N	168c7c6b-8c66-4322-91c7-89716c9f5d96	1303	أجهزة وموزعات	كمية	PCS	1	45	45	65	65	عبد المجيد عابدين
1105b0d7-01dc-4a50-bbf0-f50555fa8ad6	Iron roll drying machine	ماكنة رول تنشيف حديد	\N	\N	130300008	\N	موزعات محارم تنشيف	\N	168c7c6b-8c66-4322-91c7-89716c9f5d96	1303	أجهزة وموزعات	كمية	PCS	1	65	65	100	100	عبد المجيد عابدين
64b43713-8347-4f5c-b35d-72089d0d4277	Slim notch machine	ماكنة نوتتش سليم	\N	\N	130300009	\N	موزعات محارم تنشيف	\N	\N	1303	أجهزة وموزعات	كمية	PCS	1	140	140	180	180	العابودي
b04e96a2-09d5-4b9f-a36a-c10d2242faf4	Small notch machine, Flora sensor	ماكنة نوتتش صغير سنسور فلورا	\N	\N	130300010	\N	موزعات محارم تنشيف	\N	9751e859-f86b-4f8e-9910-872759456895	1303	أجهزة وموزعات	كمية	PCS	4	640	160	1000	250	حسن عوواده-محلات ليان للمواد للبلاستيكية
abd1acc2-9be8-4611-b83d-652c769010da	Flora sensor large notch machine	ماكنة نوتتش كبير سنسور فلورا	\N	\N	130300011	\N	موزعات محارم تنشيف	\N	9751e859-f86b-4f8e-9910-872759456895	1303	أجهزة وموزعات	كمية	PCS	4	760	190	1120	280	حسن عوواده-محلات ليان للمواد للبلاستيكية
9a8ffdcc-688f-40b0-bfee-5cc166b475ae	Kimberley notch machine	ماكنة نوتتش كمبرلي	\N	\N	130300012	\N	موزعات محارم تنشيف	\N	\N	1303	أجهزة وموزعات	كمية	PCS	1	175	175	220	220	العابودي
38ed022e-1aa4-449d-9494-0f2f9bf34e4b	Black Notch Rollo Pack Machine	ماكنة نوتش رولو باك اسود	\N	\N	130300014	\N	موزعات محارم تنشيف	\N	\N	1303	أجهزة وموزعات	كمية	PCS	4	600	150	880	220	فاركو
35e6047e-2716-4f94-8a2a-ec069d0f563c	Machine (9000)	ماكنة (9000)	\N	\N	130400001	\N	موزعات ورق تواليت	\N	\N	1304	أجهزة وموزعات	كمية	PCS	1	25	25	45	45	فاركو
6b7c1b67-295f-467b-82f7-d4d1004fbd11	Jumbo Rollo Pack Toilet Machine	ماكنة تواليت جامبو رولو باك	\N	\N	130400002	\N	موزعات ورق تواليت	\N	\N	1304	أجهزة وموزعات	كمية	PCS	8	160	20	360	45	فاركو
dc3d0de2-81da-419a-be97-211cb342857e	Jumbo stainless toilet machine	ماكنة تواليت جامبو ستانلس	\N	\N	130400003	\N	موزعات ورق تواليت	\N	\N	1304	أجهزة وموزعات	كمية	PCS	20	900	45	2000	100	حسونة-ايليت لصناعه البلاستيك
7a9c47b3-652d-4350-a5d7-b356ba163241	Jumbo toilet flush machine	ماكنة تواليت جامبو سحب	\N	\N	130400004	\N	موزعات ورق تواليت	\N	\N	1304	أجهزة وموزعات	كمية	PCS	8	224	28	360	45	فاركو
04213ce9-a586-4e14-ad2b-18e9e69e0521	Jumbo Toilet Pull Flora	ماكنة تواليت جامبو سحب فلورا	\N	\N	130400005	\N	موزعات ورق تواليت	\N	9751e859-f86b-4f8e-9910-872759456895	1304	أجهزة وموزعات	كمية	PCS	8	224	28	360	45	حسن عوواده-محلات ليان للمواد للبلاستيكية
f386452c-6a9b-4ab8-b450-b95fe8a454bf	Jumbo Toilet Pull Flora Medium	ماكنة تواليت جامبو سحب فلورا وسط	\N	\N	130400006	\N	موزعات ورق تواليت	\N	9751e859-f86b-4f8e-9910-872759456895	1304	أجهزة وموزعات	كمية	PCS	8	224	28	360	45	حسن عوواده-محلات ليان للمواد للبلاستيكية
14e0634e-d3bd-40ef-a77d-ba629ff4fd12	Jumbo medium pull machine	ماكنة جامبو سحب وسط	\N	\N	130400007	\N	موزعات ورق تواليت	\N	\N	1304	أجهزة وموزعات	كمية	PCS	8	224	28	360	45	فاركو
a17633cc-dddb-4a12-a7d0-d144a893d029	Dispenser machine (table napkins) paper napkins	ماكنة ديسبنسر (نابكنز طاولة) مناديل ورقية	\N	\N	130500001	\N	موزعات مناديل طاولة (نابكنز)	\N	\N	1305	أجهزة وموزعات	كمية	PCS	60	1680	28	2400	40	فاركو
8cdb3d21-8ec6-40cd-98bd-115c958b48c4	Hazmatik machine	ماكنة هزماتيك	\N	\N	130600001	\N	موزعات معطر جو	\N	\N	1306	أجهزة وموزعات	كمية	PCS	6	99.6	16.6	150	25	التوريدات الطبية
c5e2a5df-e708-4327-8ef7-7464d08bd32a	Airwick steam machine	ماكنة ايرويك بخار	\N	\N	130600002	\N	موزعات معطر جو	\N	\N	1306	أجهزة وموزعات	كمية	PCS	4	100	25	140	35	التوريدات الطبية
dfeb3520-7681-4bcc-966e-8620eeb8637c	ice machine	ماكنة جليد	\N	\N	130600003	\N	موزعات معطر جو	\N	\N	1306	أجهزة وموزعات	كمية	PCS	6	156	26	210	35	عبد الله بلعاوي
53e99036-bd5d-4ec6-89da-d3829d5ed957	Hysmatic machine	ماكنة هيزماتيك	\N	\N	130600004	\N	موزعات معطر جو	\N	\N	1306	أجهزة وموزعات	كمية	PCS	6	99.6	16.6	150	25	التوريدات الطبية
a13a85e7-46e1-4a8f-8609-485e563fdcb5	Hoover 2000	هوفر 2000	\N	\N	130700001	\N	أجهزة تنشيف كهربائية	\N	aa0df6dc-69ac-43b3-93f0-3008f364e2dc	1307	أجهزة وموزعات	كمية	PCS	1	350	350	450	450	رويال الصناعية التجارية
ee068673-62dd-4ee5-80bd-cd0077b409d5	Hoover 1200	هوفر 1200	\N	\N	130700002	\N	أجهزة تنشيف كهربائية	\N	aa0df6dc-69ac-43b3-93f0-3008f364e2dc	1307	أجهزة وموزعات	كمية	PCS	1	150	150	250	250	رويال الصناعية التجارية
0e8d1723-eddd-4b29-b77a-30a8506ee4f5	macaroni mop	ممسحة معكرونة	\N	\N	140100001	\N	مماسح احترافية	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1401	أدوات تنظيف احترافية	كمية	PCS	1	3	3	5	5	الانوار-ابو ععفيفة
41b4aa42-694b-4939-96a9-0cda4cf5c862	Mob 60cm	موب 60سم	\N	\N	140100002	\N	مماسح احترافية	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1401	أدوات تنظيف احترافية	كمية	PCS	1	25	25	45	45	عريب جرادات-سكاي سيرفس
4de0d2e9-a2a7-41a0-8f67-4002a1b3a7c3	Plastic warning triangle sign (Caution: Slip)	مثلث بلاستيك للتحذير إشارة (احذر الانزلاق)	\N	\N	140100003	\N	مماسح احترافية	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1401	أدوات تنظيف احترافية	كمية	PCS	20	540	27	900	45	عريب جرادات-سكاي سيرفس
09d61826-d0e0-457b-a135-0f7cc8b4a687	Mob macaroni	موب معكرونة	\N	\N	140100005	\N	مماسح احترافية	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1401	أدوات تنظيف احترافية	كمية	PCS	1	12	12	25	25	عريب جرادات-سكاي سيرفس
952dc789-c959-4fa1-83dc-b61719977fc9	Excellent type mob (110)	موب نوع ممتاز (110)	\N	\N	140100006	\N	مماسح احترافية	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1401	أدوات تنظيف احترافية	كمية	PCS	1	40	40	65	65	عريب جرادات-سكاي سيرفس
b131ebc9-2ee4-4015-997e-e7f56e723260	Excellent type mop (60cm)	موب نوع ممتاز (60سم)	\N	\N	140100007	\N	مماسح احترافية	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1401	أدوات تنظيف احترافية	كمية	PCS	1	34	34	50	50	عريب جرادات-سكاي سيرفس
3d61a6ca-6202-4018-89b7-211700dcb7f2	Mob is an excellent type (90)	موب نوع ممتاز (90)	\N	\N	140100008	\N	مماسح احترافية	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1401	أدوات تنظيف احترافية	كمية	PCS	1	34	34	55	55	عريب جرادات-سكاي سيرفس
a3ddc337-c39e-495d-8e3b-b24c373fe814	75cm black scraper	قشاطة 75سم أسود	\N	\N	140200001	\N	قشاطات احترافية (أرضيات وزجاج)	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1402	أدوات تنظيف احترافية	كمية	PCS	20	150	7.5	240	12	الانوار-ابو ععفيفة
edd11665-5c2b-4432-8c19-986257a0507f	30cm glass scraper	قشاطة زجاج 30سم	\N	\N	140200002	\N	قشاطات احترافية (أرضيات وزجاج)	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1402	أدوات تنظيف احترافية	كمية	PCS	1	17	17	25	25	الانوار-ابو ععفيفة
8b73020f-4d9c-4553-893e-7f41106ed0f2	40cm glass scraper	قشاطة زجاج 40سم	\N	\N	140200003	\N	قشاطات احترافية (أرضيات وزجاج)	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1402	أدوات تنظيف احترافية	كمية	PCS	1	19	19	25	25	الانوار-ابو ععفيفة
759d8d38-3002-464f-94ff-cc3cbd25cb55	Silicone scraper 45cm	قشاطة سيليكون 45سم	\N	\N	140200004	\N	قشاطات احترافية (أرضيات وزجاج)	\N	\N	1402	أدوات تنظيف احترافية	كمية	PCS	24	186	7.75	288	12	تارجت
b9c16d7d-b2e0-4a3e-842f-4ee601b360e9	30cm silicone scraper	قشاطة سيليكون 30سم	\N	\N	140200005	\N	قشاطات احترافية (أرضيات وزجاج)	\N	\N	1402	أدوات تنظيف احترافية	كمية	PCS	24	180	7.5	360	15	تارجت
d4ded865-4baf-4907-86d1-4ba09a3cf877	Black rug (hall)	مجرود أسود (صالة)	\N	\N	140300001	\N	مجاريد احترافية	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1403	أدوات تنظيف احترافية	كمية	PCS	20	440	22	900	45	عريب جرادات-سكاي سيرفس
64107dc5-38d5-4673-8d7f-c4a1be934d55	Stainless steel dustpan with handle	مجرود ستانلس مع عصا	\N	\N	140300002	\N	مجاريد احترافية	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1403	أدوات تنظيف احترافية	كمية	PCS	20	240	12	340	17	الانوار-ابو ععفيفة
0e2bfb07-ba81-45a3-98c4-41c470fda3e4	shovel with bulldozer stick	مجرود مع عصا بلدوزر	\N	\N	140300003	\N	مجاريد احترافية	\N	5df1829d-82ef-4058-8f4e-a89d70c34872	1403	أدوات تنظيف احترافية	كمية	PCS	24	108	4.5	240	10	الهلال والنجمة الحديثة
ab77b58b-1b06-40e8-9ae6-a6f25498dd90	Dustpan with brush	مجرود مع فرشاة	\N	\N	140300004	\N	مجاريد احترافية	\N	\N	1403	أدوات تنظيف احترافية	كمية	PCS	24	48	2	96	4	جولف بلاستيك الصناعية
dc59abff-7d3b-412c-b978-150d668f4cb4	Dustpan with broom	مجرود مع مكنسة	\N	\N	140300005	\N	مجاريد احترافية	\N	\N	1403	أدوات تنظيف احترافية	كمية	PCS	12	84	7	120	10	جولف بلاستيك الصناعية
43b281e8-9259-4b02-8f25-6f2917228e32	Telescope dust feather (3 meters)	ريشة غبرة تلسكوب (3 متر)	\N	\N	140400001	\N	فراشي ومنافض غبار احترافية	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1404	أدوات تنظيف احترافية	كمية	PCS	1	25	25	35	35	عريب جرادات-سكاي سيرفس
8355112b-f13d-4871-b116-6888997807ca	Black round scotch tape	سكوتش دائري أسود	\N	\N	140400002	\N	فراشي ومنافض غبار احترافية	\N	b50e9e0c-24de-4695-938d-e120cff2f25e	1404	أدوات تنظيف احترافية	كمية	PCS	5	80	16	125	25	حسونه لمواد البناء
24f19db5-5120-460d-8dea-ef129623c217	white round scotch tape	سكوتش دائري ابيض	\N	\N	140400003	\N	فراشي ومنافض غبار احترافية	\N	b50e9e0c-24de-4695-938d-e120cff2f25e	1404	أدوات تنظيف احترافية	كمية	PCS	5	80	16	125	25	حسونه لمواد البناء
0f2a400b-9e97-4fb7-9224-d6b99a875a8e	Red round scotch tape	سكوتش دائري احمر	\N	\N	140400004	\N	فراشي ومنافض غبار احترافية	\N	b50e9e0c-24de-4695-938d-e120cff2f25e	1404	أدوات تنظيف احترافية	كمية	PCS	5	80	16	125	25	حسونه لمواد البناء
1e1d6bbc-798e-4757-868a-a577460bc03a	Asafa (2 meters)	عسافة (2 متر)	\N	\N	140400005	\N	فراشي ومنافض غبار احترافية	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1404	أدوات تنظيف احترافية	كمية	PCS	1	35	35	50	50	الانوار-ابو ععفيفة
c3c42f5a-d896-4b76-bb64-06ccc144058f	White car vacuum cleaners	مكانس سيارات أبيض	\N	\N	140400006	\N	فراشي ومنافض غبار احترافية	\N	\N	1404	أدوات تنظيف احترافية	كمية	PCS	12	140	11.67	240	20	عبد الله بلعاوي
194f8796-5f4f-4977-aaf5-a4752f621dfb	Telescope rod (2.4 m)	عصا تلسكوب (2.4 متر)	\N	\N	140500001	\N	عصي تلسكوبية وملحقات	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1405	أدوات تنظيف احترافية	كمية	PCS	1	30	30	45	45	عريب جرادات-سكاي سيرفس
6ae393c3-cad0-46e6-a104-f627941244cf	Telescope stick (3 meters)	عصا تلسكوب (3 متر)	\N	\N	140500003	\N	عصي تلسكوبية وملحقات	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1405	أدوات تنظيف احترافية	كمية	PCS	1	40	40	60	60	عريب جرادات-سكاي سيرفس
080a6726-aebd-49d0-93ce-9c1bc56b632a	Sky cream skin	جلدة قشاطة سكاي	\N	\N	140500004	\N	عصي تلسكوبية وملحقات	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1405	أدوات تنظيف احترافية	كمية	PCS	1	15	15	25	25	عريب جرادات-سكاي سيرفس
d347df52-b9f2-4266-9827-b514c56b0956	Sky Blades (10/1)	شفرات سكاي (10/1)	\N	\N	140600002	\N	مكاشط (شبختل) وشفرات	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1406	أدوات تنظيف احترافية	كمية	PCS	1	5	5	10	10	عريب جرادات-سكاي سيرفس
4c5ff576-5b0f-47a7-8082-368484adcbca	Mishaf	مشحاف	\N	\N	140600003	\N	مكاشط (شبختل) وشفرات	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1406	أدوات تنظيف احترافية	كمية	PCS	12	78	6.5	120	10	عريب جرادات-سكاي سيرفس
01caac12-b819-4565-a230-ea8d458af254	A spatula with a hand	مشحاف مع إيد	\N	\N	140600004	\N	مكاشط (شبختل) وشفرات	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1406	أدوات تنظيف احترافية	كمية	PCS	24	408	17	840	35	عريب جرادات-سكاي سيرفس
08883ea0-e7ee-4b5f-904d-0683f576dc01	cleaning cart	عربة تنظيف	\N	\N	140700001	\N	عربات تنظيف وخدمة	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1407	أدوات تنظيف احترافية	كمية	PCS	1	415	415	60	60	عريب جرادات-سكاي سيرفس
f6b11c3a-0477-4352-8712-34796cf92a78	Service cart	عربة سيرفيس	\N	\N	140700002	\N	عربات تنظيف وخدمة	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1407	أدوات تنظيف احترافية	كمية	PCS	1	280	280	400	400	عريب جرادات-سكاي سيرفس
ac7323da-6fe3-4fcc-8e10-831da1d08284	hospitality cart	عربة ضيافة	\N	\N	140700003	\N	عربات تنظيف وخدمة	\N	49acaee6-8b21-47d7-acee-c530abc6a037	1407	أدوات تنظيف احترافية	كمية	PCS	1	320	320	450	450	عريب جرادات-سكاي سيرفس
448a1ea9-f80c-4b65-8e39-6206ed3caf70	square barrel	برميل مربع	\N	\N	150100001	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	1	75	75	100	100	الاستقامة/سنقرط
1345d84c-9108-48d1-91a7-98e389046ce2	Container (240 liters)	حاوية (240 لتر)	\N	\N	150100002	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	1	150	150	200	200	بلاستيك القدس الصناعية التجارية -الاشمر
bee83144-9cbd-42b4-98b9-f57d9086053e	Green container (30 liters)	حاوية أخضر (30 لتر)	\N	\N	150100003	\N	سلال وحاويات قمامة	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1501	أدوات تنظيف عامة	كمية	PCS	1	30	30	45	45	الانوار-ابو ععفيفة
80508fc3-89bc-4e7f-80c1-51f5bd1fbd92	stainless steel bath bucket	سطل حمام ستانلس	\N	\N	150100004	\N	سلال وحاويات قمامة	\N	aa0df6dc-69ac-43b3-93f0-3008f364e2dc	1501	أدوات تنظيف عامة	كمية	PCS	1	40	40	60	60	رويال الصناعية التجارية
f15d7787-8dcf-47b0-bed8-fabcaf7dbd57	Basket (28 liters)	سلة (28 لتر)	\N	\N	150100005	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	1	16	16	25	25	بلاستيك القدس الصناعية التجارية -الاشمر
a8faec0c-09b5-44f6-96a1-25dd96beb4c9	plastic mesh basket	سلة شبك بلاستيك	\N	\N	150100006	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	1	2.5	2.5	4	4	بلاستيك القدس الصناعية التجارية -الاشمر
0799389f-ee43-4b7b-bbd5-0475bb8a56d4	laundry basket	سلة غسيل	\N	\N	150100007	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	1	8	8	12	12	بلاستيك القدس الصناعية التجارية -الاشمر
8198ca53-c191-456b-ba28-b875ddedd347	Fan basket (15 liters)	سلة مروحة (15 لتر)	\N	\N	150100008	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	16	208	13	320	20	بلاستيك القدس الصناعية التجارية -الاشمر
da31d832-ceab-417b-bd10-c47653ea2fb0	Fan basket (16 liters)	سلة مروحة (16 لتر)	\N	\N	150100009	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	16	208	13	288	18	بلاستيك القدس الصناعية التجارية -الاشمر
e69c771a-e5ca-40dc-a5ec-0ff847f89d22	50L Fan Basket (White)	سلة مروحة 50 لتر (ابيض)	\N	\N	150100010	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	8	240	30	360	45	بلاستيك القدس الصناعية التجارية -الاشمر
44e7a54b-c9c6-4532-b384-8e0459f1db47	50L Fan Basket (Beige)	سلة مروحة 50 لتر (بيج)	\N	\N	150100011	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	8	240	30	360	45	بلاستيك القدس الصناعية التجارية -الاشمر
b3669fd5-f261-4e5d-b895-aac46cb7c243	50L Fan Basket (Residential)	سلة مروحة 50 لتر (سكني)	\N	\N	150100012	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	8	240	30	360	45	بلاستيك القدس الصناعية التجارية -الاشمر
7a2fb707-30ad-4b9f-8564-fc0cf34e3e75	Fan basket (8 liters)	سلة مروحة (8 لتر)	\N	\N	150100013	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	16	144	9	240	15	بلاستيك القدس الصناعية التجارية -الاشمر
1186d4e2-bb6c-4d4b-b448-f4b51840e328	Basket with pedal (small)	سلة مع دعسة (صغير)	\N	\N	150100014	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	1	12	12	18	18	بلاستيك القدس الصناعية التجارية -الاشمر
2754f23b-2892-44f3-98ef-101a063a8d71	Basket with pedal (large)	سلة مع دعسة (كبير)	\N	\N	150100015	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	1	68	68	90	90	بلاستيك القدس الصناعية التجارية -الاشمر
315de992-4353-4a96-9763-c77875651903	Iron wastebasket (small)	سلة مهملات حديد (صغير)	\N	\N	150100016	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	24	168	7	240	10	الاستقامة/سنقرط
2c5b0d61-643c-45ef-bacb-d16e810cce92	Iron wastebasket (large)	سلة مهملات حديد (كبير)	\N	\N	150100017	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	24	240	10	432	18	الاستقامة/سنقرط
416dd5c8-eb36-4fb8-a5eb-07367af2de1f	Iron wastebasket (medium)	سلة مهملات حديد (وسط)	\N	\N	150100018	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	24	216	9	360	15	الاستقامة/سنقرط
7b65b8b4-642d-404f-8bb4-706590053279	Basket (70 liters)	سلة (70 لتر)	\N	\N	150100019	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	1	75	75	110	110	الاستقامة/سنقرط
fbac151b-3484-416c-8d71-e3efc7a70914	Stainless steel wall basket	سلة حائط ستانلس	\N	\N	150100021	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	1	50	50	70	70	الاستقامة/سنقرط
d92422f6-bbc7-4a54-9c15-c83dd3cfad02	Glass bottle	متكة زجاج	\N	\N	150100022	\N	سلال وحاويات قمامة	\N	\N	1501	أدوات تنظيف عامة	كمية	PCS	1	2.5	2.5	5	5	الاستقامة/سنقرط
77807286-6a13-4266-ba7e-3fc0379eb04f	Delivery bags	أكياس دليفري	\N	\N	160100001	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	250	180	0.72	261	1.04	فاركو
e0687203-c154-4213-be8f-80b018c7f8d3	cocktail suspenders	حمالات كوكتيل	\N	\N	160100002	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	1	0.35	0.35	0.5	0.5	عباس مطاوع
59f1c636-fdbf-48c1-9833-50fdca900b6a	BBQ bags	أكياس شوي	\N	\N	160100003	\N	شنط وأكياس (بلاستيك وورق)	\N	9751e859-f86b-4f8e-9910-872759456895	1601	تعبئة وتغليف	كمية	PCS	40	38	0.95	80	2	حسن عوواده-محلات ليان للمواد للبلاستيكية
892a2f28-ebcb-4594-99ac-eca5efc908d3	Zippered freezer bags (Target)	اكياس تفريز سحاب (تارجت)	\N	\N	160100004	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	48	264	5.5	384	8	تارجت
c1ca9ae6-2792-4083-943c-86261ef2d96a	bread bags	اكياس خبز	\N	\N	160100005	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	1	50	50	85	85	عباس مطاوع
585fb3a5-881d-4c02-994d-cdf8b22f3831	Baguette (1/4 filling 450)	باجيت (1/4 تعبئة 450)	\N	\N	160100006	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	4	45	11.25	65	16.25	عباس مطاوع
53016654-0b8e-49c8-8430-0c9423cf8c8f	Short baguette	باجيت قصير	\N	\N	160100007	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	4	45	11.25	65	16.25	عباس مطاوع
fb91647d-ffbe-4b0c-9137-35ff3a300fc1	Bags (Bon Appetit)	أكياس (صحتين وعافية)	\N	\N	160100008	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	6	28	4.67	42	7	عباس مطاوع
c11b3272-398c-4fb6-bea9-0c66121e58e7	Nylon (40/60)	نايلون (40/60)	\N	\N	160100009	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	25	170	6.8	250	10	الرحمة للنايلون-وجدي الغانم
ab3f8145-1fde-48cf-b82e-a7c415a8b9fe	Soft nylon (90/75)	نايلون طري (90/75)	\N	\N	160100010	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	25	170	6.8	250	10	الرحمة للنايلون-وجدي الغانم
89c908a5-e8b2-4a33-9aff-77a60bf52d36	Paper (No. 4)	ورق (نمرة 4)	\N	\N	160100011	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	4	50	12.5	60	15	عباس مطاوع
43a2d12f-eabf-4a21-8ba5-ce653b9039a3	Paper (No. 8)	ورق (نمرة 8)	\N	\N	160100012	\N	شنط وأكياس (بلاستيك وورق)	\N	\N	1601	تعبئة وتغليف	كمية	PCS	4	55	13.75	80	20	عباس مطاوع
f02c024f-e00f-4513-a44c-c70d0477f3a9	Avocado gelatin 5 kg	جلاتين أفوكادو 5كغم	\N	\N	160200001	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	1	35	35	250	50	الاشهب للتجارة والاستثمار
fca9b897-f6c2-4172-b9c2-82c324a38ddc	Gelatin Brushef (30cm)	جلاتين بروشيف (30سم)	\N	\N	160200002	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	24	204	8.5	336	14	الاشهب للتجارة والاستثمار
d0f89b5a-a513-4346-8add-613bf4f7b575	Gelatin Brushef (45cm)	جلاتين بروشيف (45سم)	\N	\N	160200003	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	16	192	12	288	18	الاشهب للتجارة والاستثمار
38598851-74bd-460f-af39-9ac9dc0d8122	Gelatin food wrap (30cm)	جلاتين تغليف طعام الكا (30سم)	\N	\N	160200004	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	24	288	12	480	20	الاشهب للتجارة والاستثمار
7e91228e-4a0d-45c9-8423-06e054a01e50	Food Wrap Gelatin 30cm (150m)	جلاتين تغليف طعام 30سم (150متر)	\N	\N	160200005	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	12	96	8	168	14	ابو تبانه
eb2a0e98-a69c-47fc-843a-a9a9b3f8053a	Food Wrap Gelatin 30cm (300m)	جلاتين تغليف طعام 30سم (300متر)	\N	\N	160200006	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	12	180	15	240	20	ابو تبانه
a206e509-2f5c-498a-a1a2-7f1d61e258dc	Food wrap gelatin 45cm (200m)	جلاتين تغليف طعام 45سم (200متر)	\N	\N	160200007	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	12	216	18	324	27	ابو تبانه
360e7090-6800-4479-a129-add937fc7a29	Food wrap gelatin 45cm (300m)	جلاتين تغليف طعام 45سم (300متر)	\N	\N	160200008	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	12	276	23	360	30	ابو تبانه
31ed3482-7a5b-4e16-8e17-a088d0a5b282	Food wrapping gelatin (5 kg)	جلاتين تغليف طعام (5كغم)	\N	\N	160200009	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	1	36	36	50	50	ابو تبانه
1ad12969-4d74-4200-a60b-1582eeaae8ff	Elka Food Wrap Gelatin (45cm)	جلاتين تغليف طعام إلكا (45سم)	\N	\N	160200010	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	16	288	18	352	22	ابو تبانه
6e002c7f-1b98-4d2d-be36-b3d6aa6f494c	Aluminum foil roll (46 meters)	رول قصدير (46 متر)	\N	\N	160200014	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	12	240	20	300	25	تارجت
d941a9f6-50e7-4eb4-8d4e-7456bf533a10	Aluminum foil roll (55 meters)	رول قصدير (55 متر)	\N	\N	160200015	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	24	360	15	600	25	عوني الطويل-ميكرو بور
8901a61b-c313-46e4-905d-b2ee6f9771e7	Aluminum foil roll (69 meters)	رول قصدير (69 متر)	\N	\N	160200016	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	12	240	20	300	25	تارجت
6ed14981-3559-42a6-afb9-f3edcd0c77e8	Foil roll (7.5 metres)	رول قصدير (7.5 متر)	\N	\N	160200017	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	24	75	3.13	120	5	تارجت
3d7049c6-ce7a-41c4-b761-3a6d03675167	Foil roll (100 meters)	رول قصدير (100 متر)	\N	\N	160200020	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	12	420	35	609	50.75	عوني الطويل-ميكرو بور
18347363-859e-4013-b424-26a60911dcf6	Golf Gelatin (5 kg)	جلاتين جولف (5 كغم)	\N	\N	160200021	\N	رولات تغليف (نايلون وقصدير)	\N	\N	1602	تعبئة وتغليف	كمية	PCS	1	36	36	50	50	جولف بلاستيك الصناعية
dd91778e-4902-4eab-bc89-c0884074d963	parchment paper	ورق زبدة	\N	\N	160300001	\N	ورق زبدة	\N	\N	1603	تعبئة وتغليف	كمية	PCS	20	110	5.5	200	10	كرم المصري-سما للتجارة العامة
a52d9827-0843-494d-a92f-480090c02bc9	parchment paper	ورق زبدة	\N	\N	160300002	\N	ورق زبدة	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	1603	تعبئة وتغليف	كمية	PCS	24	127.2	5.3	240	10	الانوار-ابو ععفيفة
24802049-1939-4e2a-aeb7-11c8a90b1f79	Parchment paper (40/60 - 1000 sheets)	ورق زبدة (40/60 - 1000 ورقة)	\N	\N	160300003	\N	ورق زبدة	\N	\N	1603	تعبئة وتغليف	كمية	PCS	1	140	140	190	190	كرم المصري-سما للتجارة العامة
eab51191-f310-46e6-a250-ce4a1d8bf6b4	Parchment paper (50/70 - 1000 sheets)	ورق زبدة (50/70 - 1000 ورقة)	\N	\N	160300004	\N	ورق زبدة	\N	\N	1603	تعبئة وتغليف	كمية	PCS	1	170	170	190	190	كرم المصري-سما للتجارة العامة
9321eadf-4695-43d4-95c6-2684ced4220b	parchment paper	ورق زبدة (مبكت)	\N	\N	160300005	\N	ورق زبدة	\N	\N	1603	تعبئة وتغليف	كمية	PCS	20	110	5.5	200	10	كرم المصري-سما للتجارة العامة
dc9a6ef6-065c-462d-9130-d0ea6900d107	Cheese boxes (750 ml)	علب جبنة (750 مل)	\N	\N	160400001	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	600	190	0.32	300	0.5	فاركو
0e294e42-9f76-47f4-be88-60a54b608037	Thermal boxes	علب حراري	\N	\N	160400002	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	16	150	9.38	176	11	سنقرط للمنتوجات الغذائية
912b4795-b175-4246-ac13-0862235e31b5	Black liter cans	علب لتر أسود	\N	\N	160400003	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	d434411e-afa8-4b8c-9c07-fa3dff420a39	1604	تعبئة وتغليف	كمية	PCS	200	120	0.6	180	0.9	شركة جمانه
8135b2e7-2462-4369-a4db-8b2f764dd64f	Ma'dinite (40)	معدينيت (40)	\N	\N	160400004	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	d434411e-afa8-4b8c-9c07-fa3dff420a39	1604	تعبئة وتغليف	كمية	PCS	360	120	0.33	180	0.5	شركة جمانه
72c8e341-6b59-410c-9033-064cf4dda778	Ma'dinite (60)	معدينيت (60)	\N	\N	160400005	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	d434411e-afa8-4b8c-9c07-fa3dff420a39	1604	تعبئة وتغليف	كمية	PCS	400	120	0.3	200	0.5	شركة جمانه
dfc6de8e-d591-4742-91bb-241bbfe3b990	1000ml cans (100/1)	علب 1000مل مكعبة (100/1)	\N	\N	160400006	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	4	220	55	320	80	فاركو
ee2f0e97-8708-4a1f-9831-c2033ae9bee1	500ml cans with lid (50/1)	علب 500مل مع غطاء (50/1)	\N	\N	160400007	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	3ad4b1e2-3909-4296-a04c-8eb7dc53815d	1604	تعبئة وتغليف	كمية	PCS	20	180	9	300	15	محمد حسونه-شركة الحرم
a53ad791-f16d-4d92-80bf-353c660f7d46	500ml cube cans (100/1)	علب 500مل مكعبة (100/1)	\N	\N	160400008	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	6	200	33.33	420	70	فاركو
28fc9109-64f4-4203-8967-13ef7d01dc84	750ml cans of salad or cubes (1/100)	علب 750مل سلطة او مكعبة (100/1)	\N	\N	160400009	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	4	220	55	300	75	فاركو
5cf42ce9-3b73-4c27-a8d5-21d7f6483e38	White Cans (14 oz)	علب أبيض (14 أوز)	\N	\N	160400010	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	40	110	2.75	160	4	فاركو
17c8bd85-445c-4028-9508-d559a5fedfed	55 dome boxes	علب قبة 55	\N	\N	160400011	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	1	195	195	240	240	فاركو
24f312fd-2d70-49e6-b5be-e239db1b7d61	Hadar (1250)	هادار (1250)	\N	\N	160400012	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	200	90	0.45	130.5	0.65	جولف بلاستيك الصناعية
ffa1b48a-812c-4af2-be7b-a3ef10588de7	Hadar (1500/1750)	هادار (1500/1750)	\N	\N	160400013	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	400	200	0.5	300	0.75	فاركو
49f83840-ec96-4a92-9543-5c502f831c2e	Hadar (2000)	هادار (2000)	\N	\N	160400014	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	4	220	55	3.2	0.8	فاركو
5f043229-5f20-4273-9b1e-fad37e04a8f0	Hadar 2000 (Dome)	هادار 2000 (قبة)	\N	\N	160400015	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	4	220	55	3.4	0.85	فاركو
1cb9ea2d-44d2-4aa4-b362-cfa635a85636	Hadar (1500 and 1750)	هادار (1500 و 1750)	\N	\N	160400016	\N	علب بلاستيك بغطاء ثابت/مدمج	\N	\N	1604	تعبئة وتغليف	كمية	PCS	4	200	50	3	0.75	فاركو
15a8d364-3592-4ca0-99aa-38061ada230f	1000ml cans 1/25	علب 1000مل1/25	\N	\N	160500001	\N	علب بلاستيك بغطاء منفصل	\N	\N	1605	تعبئة وتغليف	كمية	PCS	20	100	5	300	15	حسونة-ايليت لصناعه البلاستيك
0bb78e79-ac4f-4555-9b4e-fd63ed52f201	4.5 liter cans	علب 4.5 لتر	\N	\N	160500002	\N	علب بلاستيك بغطاء منفصل	\N	46242857-67e8-4da9-8061-64d245592fa2	1605	تعبئة وتغليف	كمية	PCS	200	700	3.5	1000	5	حامد ناصر الدين
8fdd8974-d4b5-403e-a739-66448152b5eb	80ml cans (100)	علب 80مل (100)	\N	\N	160500003	\N	علب بلاستيك بغطاء منفصل	\N	46242857-67e8-4da9-8061-64d245592fa2	1605	تعبئة وتغليف	كمية	PCS	10	65	6.5	100	10	حامد ناصر الدين
864e434b-118a-4d9f-b57e-f471b1dec35a	M60 cans	علب M60	\N	\N	160500004	\N	علب بلاستيك بغطاء منفصل	\N	\N	1605	تعبئة وتغليف	كمية	PCS	450	150	0.33	225	0.5	الشرق الاوسط الحديثة
ff399904-8acb-4333-932a-43e3c5574460	Black round boxes (1000)	علب دائرية سوداء (1000)	\N	\N	160500005	\N	علب بلاستيك بغطاء منفصل	\N	\N	1605	تعبئة وتغليف	كمية	PCS	300	168	0.56	270	0.9	فاركو
d880ff06-89c4-47f5-b330-b530d2e35063	Black round cans (500 ml)	علب دائرية سوداء (500 مل)	\N	\N	160500006	\N	علب بلاستيك بغطاء منفصل	\N	\N	1605	تعبئة وتغليف	كمية	PCS	300	168	0.56	270	0.9	فاركو
8ef3b58e-71cc-42b7-ad67-25e5e2edc87b	Black round boxes (750)	علب دائرية سوداء (750)	\N	\N	160500007	\N	علب بلاستيك بغطاء منفصل	\N	\N	1605	تعبئة وتغليف	كمية	PCS	300	168	0.56	270	0.9	فاركو
9cb2a72d-b006-4f43-b5e2-fef4b52ebcbf	sushi boxes	علب سوشي	\N	\N	160500008	\N	علب بلاستيك بغطاء منفصل	\N	\N	1605	تعبئة وتغليف	كمية	PCS	400	140	0.35	240	0.6	الكاظم
4ed103de-c27d-4f9f-a388-ec951d2ba3fa	125ml can (100/1)	علبة 125 مل (100/1)	\N	\N	160500009	\N	علب بلاستيك بغطاء منفصل	\N	3ad4b1e2-3909-4296-a04c-8eb7dc53815d	1605	تعبئة وتغليف	كمية	PCS	20	225	11.25	300	15	محمد حسونه-شركة الحرم
ccc8a772-2712-4f51-a722-2b1789288d10	250ml can (100/1)	علبة 250 مل (100/1)	\N	\N	160500010	\N	علب بلاستيك بغطاء منفصل	\N	3ad4b1e2-3909-4296-a04c-8eb7dc53815d	1605	تعبئة وتغليف	كمية	PCS	20	225	11.25	300	15	محمد حسونه-شركة الحرم
d9cfda8f-ba60-4616-afdc-b4953334d5f5	250ml thermal box (50/1)	علبة 250مل حراري (50/1)	\N	\N	160500011	\N	علب بلاستيك بغطاء منفصل	\N	\N	1605	تعبئة وتغليف	كمية	PCS	16	150	9.38	196	12.25	الشرق الاوسط الحديثة
0ad72eeb-c645-45d8-b72c-bfa54a4da782	Sauce can (1000 ml)	علبة صوص (1000 مل)	\N	\N	160500012	\N	علب بلاستيك بغطاء منفصل	\N	\N	1605	تعبئة وتغليف	كمية	PCS	24	91.2	3.8	144	6	فادي الزغير-المحيط الازرق
efa55fd4-e162-475d-ada7-665903b48e60	1 can of sauce (750 ml)	علبة صوص (750 مل)	\N	\N	160500013	\N	علب بلاستيك بغطاء منفصل	\N	\N	1605	تعبئة وتغليف	كمية	PCS	30	84	2.8	150	5	فادي الزغير-المحيط الازرق
9a07de2f-a77b-40f8-8056-d94a45f1becd	Pizza carton (small)	كرتون بيتزا (صغير)	\N	\N	160600001	\N	علب كرتون وورق حلويات	\N	\N	1606	تعبئة وتغليف	كمية	PCS	50	60	1.2	90	1.8	عباس مطاوع
edaeb094-a9a6-41a2-ab9c-41193737c931	Pizza carton (medium)	كرتون بيتزا (وسط)	\N	\N	160600002	\N	علب كرتون وورق حلويات	\N	\N	1606	تعبئة وتغليف	كمية	PCS	1	1.4	1.4	1.8	1.8	عباس مطاوع
8ad385d1-26ab-4520-bc49-6dd9557ff195	Cupcake (1/1000 No. 3)	كب كيك (1/1000 نمرة 3)	\N	\N	160600003	\N	علب كرتون وورق حلويات	\N	9751e859-f86b-4f8e-9910-872759456895	1606	تعبئة وتغليف	كمية	PCS	50	350	7	750	15	حسن عوواده-محلات ليان للمواد للبلاستيكية
11e018d1-885c-496a-affd-2ad2f9e66789	Candy paper (number 10)	ورق حلويات (نمرة 10)	\N	\N	160600004	\N	علب كرتون وورق حلويات	\N	9751e859-f86b-4f8e-9910-872759456895	1606	تعبئة وتغليف	كمية	PCS	72	720	10	1080	15	حسن عوواده-محلات ليان للمواد للبلاستيكية
67a98b52-e9a8-4f25-a91f-9f4f9d151228	Baklava sheets (9 cm)	ورق بقلاوة (9 سم)	\N	\N	160600005	\N	علب كرتون وورق حلويات	\N	\N	1606	تعبئة وتغليف	كمية	PCS	84	630	7.5	1260	15	فادي الزغير-المحيط الازرق
5d783492-4837-4edb-9060-e80048349539	Baklava sheets (number 9)	ورق بقلاوة (رقم 9)	\N	\N	160600006	\N	علب كرتون وورق حلويات	\N	9751e859-f86b-4f8e-9910-872759456895	1606	تعبئة وتغليف	كمية	PCS	84	630	7.5	1260	15	حسن عوواده-محلات ليان للمواد للبلاستيكية
b65e8279-2935-45be-a30a-6484e74294c0	White baklava paper (number 4)	ورق بقلاوة أبيض (نمرة 4)	\N	\N	160600007	\N	علب كرتون وورق حلويات	\N	9751e859-f86b-4f8e-9910-872759456895	1606	تعبئة وتغليف	كمية	PCS	72	720	10	1080	15	حسن عوواده-محلات ليان للمواد للبلاستيكية
ddf2e3d0-bb29-402c-87c6-e11c36f92506	Colored baklava sheets (No. 5)	ورق بقلاوة ملون (نمرة 5)	\N	\N	160600008	\N	علب كرتون وورق حلويات	\N	9751e859-f86b-4f8e-9910-872759456895	1606	تعبئة وتغليف	كمية	PCS	40	440	11	720	18	حسن عوواده-محلات ليان للمواد للبلاستيكية
54c96859-4807-4e5a-ad2f-f47d4413e210	Colored baklava sheets (No. 6)	ورق بقلاوة ملون (نمرة 6)	\N	\N	160600009	\N	علب كرتون وورق حلويات	\N	9751e859-f86b-4f8e-9910-872759456895	1606	تعبئة وتغليف	كمية	PCS	40	440	11	720	18	حسن عوواده-محلات ليان للمواد للبلاستيكية
98e1a49c-49a5-4317-b9ce-b03e65ab7c1c	White baklava paper (number 3)	ورق بقلاوة أبيض (نمرة 3)	\N	\N	160600010	\N	علب كرتون وورق حلويات	\N	9751e859-f86b-4f8e-9910-872759456895	1606	تعبئة وتغليف	كمية	PCS	84	630	7.5	1260	15	حسن عوواده-محلات ليان للمواد للبلاستيكية
aea979c9-2639-4c49-9f02-bf8fac1b6af6	Colored baklava sheets (number 4)	ورق بقلاوة ملون (نمرة 4)	\N	\N	160600011	\N	علب كرتون وورق حلويات	\N	9751e859-f86b-4f8e-9910-872759456895	1606	تعبئة وتغليف	كمية	PCS	84	630	7.5	1260	15	حسن عوواده-محلات ليان للمواد للبلاستيكية
53a9e858-7dd0-4da3-a2ed-fa590da9ec7e	4 oz cans	علب 4 أوز	\N	\N	160700001	\N	علب صلصات وتوابل (بلاستيك)	\N	\N	1607	تعبئة وتغليف	كمية	PCS	20	65	3.25	200	10	جولف بلاستيك الصناعية
b009ffd1-7375-4091-865a-aff2b39df42b	1 oz injection boxes (50/1)	علب 1 اوز حقن (50/1)	\N	\N	160700002	\N	علب صلصات وتوابل (بلاستيك)	\N	\N	1607	تعبئة وتغليف	كمية	PCS	20	55	2.75	79.75	3.99	جولف بلاستيك الصناعية
2eca5bde-d4ad-49e3-b708-edd16c7bfdd4	2 oz injection boxes (50/1)	علب 2 اوز حقن (50/1)	\N	\N	160700003	\N	علب صلصات وتوابل (بلاستيك)	\N	\N	1607	تعبئة وتغليف	كمية	PCS	20	60	3	87	4.35	جولف بلاستيك الصناعية
3538a918-dcc5-480b-812b-5e4140db5fe7	4 oz cans	علب 4 أوز	\N	\N	160700004	\N	علب صلصات وتوابل (بلاستيك)	\N	\N	1607	تعبئة وتغليف	كمية	PCS	10	65	6.5	188.5	9.43	جولف بلاستيك الصناعية
cefa8948-64fa-4ce1-a096-f6c303a989a1	4 oz injection boxes	علب 4 اوز حقن	\N	\N	160700006	\N	علب صلصات وتوابل (بلاستيك)	\N	d434411e-afa8-4b8c-9c07-fa3dff420a39	1607	تعبئة وتغليف	كمية	PCS	20	50	2.5	150	7.5	شركة جمانه
93c0c52f-2b7b-4ae5-b700-3c32e13c0467	75ml cans	علب 75 مل	\N	\N	160700007	\N	علب صلصات وتوابل (بلاستيك)	\N	\N	1607	تعبئة وتغليف	كمية	PCS	50	200	4	500	10	عوني الطويل-ميكرو بور
9ae05554-0b3a-4e9d-801f-ad70e74d7925	Garlic boxes (100/1)	علب مثومة (100/1)	\N	\N	160700008	\N	علب صلصات وتوابل (بلاستيك)	\N	\N	1607	تعبئة وتغليف	كمية	PCS	50	230	4.6	300	6	كرم المصري-سما للتجارة العامة
d737b5d9-48c0-4192-8729-3a6939ee363b	Mini bar (100/1)	ميني بار (100/1)	\N	\N	160700009	\N	علب صلصات وتوابل (بلاستيك)	\N	\N	1607	تعبئة وتغليف	كمية	PCS	10	65	6.5	100	10	فاركو
f8ae8683-b632-4317-95fd-6a12494811eb	Silicone fingers (kg)	أصابع سيليكون (كغم)	\N	\N	160800001	\N	لواصق وأشرطة تغليف	\N	9751e859-f86b-4f8e-9910-872759456895	1608	تعبئة وتغليف	وزن	كغم	15	360	24	525	35	حسن عوواده-محلات ليان للمواد للبلاستيكية
e142f380-7fb8-45d8-881b-e3c9e313ed37	Black tab	تب أسود	\N	\N	160800002	\N	لواصق وأشرطة تغليف	\N	\N	1608	تعبئة وتغليف	كمية	PCS	40	270	6.75	400	10	العسلي-فيوجن -Fusion Co
1d0d9da2-1f76-46a1-b82e-50e8e590f6a5	wide adhesive	لاصق عريض	\N	\N	160800003	\N	لواصق وأشرطة تغليف	\N	\N	1608	تعبئة وتغليف	كمية	PCS	72	200	2.78	360	5	الاشهب للتجارة والاستثمار
6a878678-5533-476f-94c0-ca7341ce47a3	Wide tape (1/72 roll)	لزيق عريض (1/72 لفة)	\N	\N	160800004	\N	لواصق وأشرطة تغليف	\N	9751e859-f86b-4f8e-9910-872759456895	1608	تعبئة وتغليف	كمية	PCS	72	220	3.06	360	5	حسن عوواده-محلات ليان للمواد للبلاستيكية
95562738-c85c-457b-b4cb-a9e5553b3ea3	Nylon drum (10 kg)	دف نايلون (10 كغم)	\N	\N	160900001	\N	مواد تغليف صناعية	\N	\N	1609	تعبئة وتغليف	كمية	PCS	10	95	9.5	150	15	الرحمة للنايلون-وجدي الغانم
72ffdfec-981b-4c23-bc47-cf29341e7d7f	Transparent stretch fabric	سترتش مشتاح شفاف	\N	\N	160900002	\N	مواد تغليف صناعية	\N	\N	1609	تعبئة وتغليف	كمية	PCS	6	102	17	150	25	زمزم للصناعت البلاستيكية
873e16bc-3cc7-4779-a204-16f168c60ee8	Blue stretch fabric	ستريتش مشتاح ازرق	\N	\N	160900003	\N	مواد تغليف صناعية	\N	\N	1609	تعبئة وتغليف	كمية	PCS	6	102	17	150	25	زمزم للصناعت البلاستيكية
ec9d7197-52fe-44dd-a3d5-8181c48099a1	Carton (tissue boxes)	كرتون (علب محارم)	\N	\N	160900004	\N	مواد تغليف صناعية	\N	\N	1609	تعبئة وتغليف	كمية	PCS	1	0.65	0.65	1	1	عباس مطاوع
d7354585-4ded-438e-a05b-5ad1918c0469	Pizza carton (36*36)	كرتون بيتزا (36*36)	\N	\N	160900005	\N	مواد تغليف صناعية	\N	\N	1609	تعبئة وتغليف	كمية	PCS	50	70	1.4	90	1.8	عباس مطاوع
c09aa9a1-7cf7-467e-9905-96775036ad24	1/10 dishes (10 kg)	مواعين 1/10 (10 كغم)	\N	\N	160900006	\N	مواد تغليف صناعية	\N	\N	1609	تعبئة وتغليف	وزن	كغم	10	40	4	50	5	عباس مطاوع
42dcbf6f-3d27-4b11-aeb1-0f694b8ae695	Table paper (kg)	ورق طاولة (كغم)	\N	\N	160900010	\N	مواد تغليف صناعية	\N	\N	1609	تعبئة وتغليف	وزن	كغم	10	40	4	600	60	عباس مطاوع
c00de9e1-9ddf-4564-8ef9-2092ec1e8b0d	heavy meal cover	غطاء وجبة ثقيل	\N	\N	161000001	\N	أغطية علب طعام	\N	\N	1610	تعبئة وتغليف	كمية	PCS	4	40	10	60	15	عباس مطاوع
c1ec0e45-1145-4d05-a1b3-50c40bb3f911	Blue 3 blades	شفرات بلو 3	\N	\N	170100001	\N	شفرات ومستلزمات حلاقة	\N	\N	1701	عناية شخصية	كمية	PCS	12	84	7	144	12	عبد الله بلعاوي
c13615c0-87a3-445a-b355-4224b0baffc5	Gillette blades	شفرات جيليت	\N	\N	170100002	\N	شفرات ومستلزمات حلاقة	\N	\N	1701	عناية شخصية	كمية	PCS	24	95	3.96	120	5	عبد الله بلعاوي
74ff3339-dbf7-480f-86ea-a22133bf95c7	Merit Blades (5/1)	شفرات ميريت (5/1)	\N	\N	170100003	\N	شفرات ومستلزمات حلاقة	\N	\N	1701	عناية شخصية	كمية	PCS	40	85	2.13	200	5	عبد الله بلعاوي
d2ce0bbc-20de-425c-b00d-b9798b6f33c6	Always	أولويز	\N	\N	170200001	\N	فوط صحية	\N	\N	1702	عناية شخصية	كمية	PCS	16	95	5.94	112	7	يونيبال
9f356cc3-c499-4e27-ab39-770eeade69e5	Disabled towels (1/4)	فوط عجزة (1/4)	\N	\N	170200002	\N	فوط صحية	\N	\N	1702	عناية شخصية	كمية	PCS	4	80	20	116	29	تارجت
9c5e208b-46cb-4d1c-b101-5b19f17b5a4e	Rose feminine pads	فوط نسائية روز	\N	\N	170200003	\N	فوط صحية	\N	\N	1702	عناية شخصية	كمية	PCS	24	30	1.25	72	3	تارجت
9a332cef-f26d-409d-81d3-b5557360c57d	Carefree	كير فري	\N	\N	170200004	\N	فوط صحية	\N	\N	1702	عناية شخصية	كمية	PCS	6	57	9.5	72	12	عبد الله بلعاوي
2cbeae41-cb80-4655-a25a-faa013e38962	Bengal	بنجال	\N	\N	170300001	\N	كريمات ومرطبات بشرة	\N	\N	1703	عناية شخصية	كمية	PCS	1	6.75	6.75	10	10	بالكو
3872c9e3-197f-40a2-b31e-9e0bf45a0e7f	Johnson's cream	كريم جونسون	\N	\N	170300002	\N	كريمات ومرطبات بشرة	\N	\N	1703	عناية شخصية	كمية	PCS	12	72	6	120	10	الطريفي مول
d1403fe8-9c03-4951-92ec-e5b7aa98d042	Small Arabic bath loofah	ليف استحمام عربي صغير	\N	\N	170400001	\N	ليف استحمام	\N	\N	1704	عناية شخصية	كمية	PCS	10	25	2.5	30	3	التالق-ابراهيم الشماس
2f2bfce4-fdbd-4bfa-9c49-f15640e08520	Large Arabic bath loofah	ليف استحمام عربي كبير	\N	\N	170400002	\N	ليف استحمام	\N	\N	1704	عناية شخصية	كمية	PCS	10	40	4	60	6	التالق-ابراهيم الشماس
2fecfa02-f0bb-4e23-9d6e-45c57897cb94	Bath loofah	ليف استحمام كف	\N	\N	170400003	\N	ليف استحمام	\N	\N	1704	عناية شخصية	كمية	PCS	12	28	2.33	48	4	موبتكس
4590b7b6-3ad4-40d1-95ab-dd08a06cc55d	Egyptian long bath loofah	ليف استحمام طويل مصري	\N	\N	170400004	\N	ليف استحمام	\N	\N	1704	عناية شخصية	كمية	PCS	12	28	2.33	48	4	موبتكس
e62f95ab-a693-43df-98ba-f4fb888e802d	Long shower loofah	ليف استحمام مطاول	\N	\N	170400006	\N	ليف استحمام	\N	\N	1704	عناية شخصية	كمية	PCS	12	42	3.5	72	6	التالق-ابراهيم الشماس
5e5ab398-a614-4968-b7d6-101e1e03249a	Axe	آكس	\N	\N	170500001	\N	مزيلات عرق	\N	\N	1705	عناية شخصية	كمية	PCS	6	45	7.5	54	9	الشرق الادنى للتوزيع والتسويق-عنبتاوي
2f32c329-164c-4502-86c1-e2701b28ebba	Gillette deodorant gel	جل مزيل عرق جيليت	\N	\N	170500002	\N	مزيلات عرق	\N	\N	1705	عناية شخصية	كمية	PCS	12	216	18	264	22	يونيبال
cc863b49-2189-4b72-ba04-99ef1cf5b217	Rexona deodorant	مزيل عرق ريكسونا	\N	\N	170500003	\N	مزيلات عرق	\N	\N	1705	عناية شخصية	كمية	PCS	12	78	6.5	120	10	مروان عوايصة
13ea3c01-27bb-4b74-840e-27ae30077b77	Aquafresh	أكوافرش	\N	\N	170600001	\N	معاجين وفراشي أسنان	\N	\N	1706	عناية شخصية	كمية	PCS	12	45	3.75	60	5	الشرق الادنى للتوزيع والتسويق-عنبتاوي
8e0f59c6-eba1-46a8-a79e-cc090d6bcec6	Sensodyne	سنسوداين	\N	\N	170600002	\N	معاجين وفراشي أسنان	\N	\N	1706	عناية شخصية	كمية	PCS	12	96	8	120	10	يونيبال
aadb2837-d198-42bd-97ef-a5b1c470568e	360 toothbrush	فرشاة أسنان 360	\N	\N	170600003	\N	معاجين وفراشي أسنان	\N	\N	1706	عناية شخصية	كمية	PCS	12	78	6.5	120	10	مروان عوايصة
320ec624-ff99-4416-9bdc-ed3f8a7bfc35	Triple toothbrush	فرشاة أسنان ثلاثي	\N	\N	170600004	\N	معاجين وفراشي أسنان	\N	\N	1706	عناية شخصية	كمية	PCS	40	200	5	400	10	مروان عوايصة
d6cd12b5-f885-409a-8246-73deaa5d4d64	Chinese toothbrush	فرشاة أسنان صيني	\N	\N	170600005	\N	معاجين وفراشي أسنان	\N	9751e859-f86b-4f8e-9910-872759456895	1706	عناية شخصية	كمية	PCS	450	105	0.23	450	1	حسن عوواده-محلات ليان للمواد للبلاستيكية
d101b291-8543-4824-a7e9-fbfb600ec8cc	charcoal toothbrush	فرشاة اسنان فحم	\N	\N	170600006	\N	معاجين وفراشي أسنان	\N	\N	1706	عناية شخصية	كمية	PCS	72	468	6.5	720	10	مروان عوايصة
df844211-fe30-45ac-a6af-633c1d5eceab	Signal toothpaste	معجون اسنان سجنال	\N	\N	170600008	\N	معاجين وفراشي أسنان	\N	\N	1706	عناية شخصية	كمية	PCS	48	185	3.85	240	5	الشرق الادنى للتوزيع والتسويق-عنبتاوي
02e22053-1bbe-4223-aecc-498893bf0a15	Extra Clean Toothbrush	فرشاة أسنان إكسترا كلين	\N	\N	170600009	\N	معاجين وفراشي أسنان	\N	\N	1706	عناية شخصية	كمية	PCS	12	24	2	36	3	مروان عوايصة
4091a7cc-82be-46d9-8206-d66c530fbf46	Cotton swabs (100)	قطن أذن (100)	\N	\N	170700001	\N	قطن وأعواد تنظيف أذن وأسنان	\N	\N	1707	عناية شخصية	كمية	PCS	12	6.75	0.56	12	1	العسلي-فيوجن -Fusion Co
4581703c-1035-48c2-a03a-c077fabd6e23	Cotton swabs (400)	قطن أذن (400)	\N	\N	170700002	\N	قطن وأعواد تنظيف أذن وأسنان	\N	\N	1707	عناية شخصية	كمية	PCS	6	18	3	24	4	تارجت
17efcb70-7fa0-4907-ba95-697715539575	plastic cotton swabs	قطن أذن بلاستيك	\N	\N	170700003	\N	قطن وأعواد تنظيف أذن وأسنان	\N	9751e859-f86b-4f8e-9910-872759456895	1707	عناية شخصية	كمية	PCS	12	30	2.5	36	3	حسن عوواده-محلات ليان للمواد للبلاستيكية
2f43c8e7-8684-44de-b302-0eeac5e88285	Jokes (100)	نكاشات (100)	\N	\N	170700004	\N	قطن وأعواد تنظيف أذن وأسنان	\N	\N	1707	عناية شخصية	كمية	PCS	12	9.5	0.79	12	1	فادي الزغير-المحيط الازرق
3caa95f2-4d7b-4195-8420-98049bb5ee0d	Jokes (200)	نكاشات (200)	\N	\N	170700005	\N	قطن وأعواد تنظيف أذن وأسنان	\N	\N	1707	عناية شخصية	كمية	PCS	10	84	8.4	200	20	فادي الزغير-المحيط الازرق
8b4bcfe6-095b-4d73-bf06-1059957762df	Ear picks (1/200)	نكاشات أذن (1/200)	\N	\N	170700006	\N	قطن وأعواد تنظيف أذن وأسنان	\N	\N	1707	عناية شخصية	كمية	PCS	240	600	2.5	960	4	فادي الزغير-المحيط الازرق
e1971173-cec5-4caf-8b32-f79dbf10bdd7	Toothpicks (1/12)	نكاشات أسنان (1/12)	\N	\N	170700007	\N	قطن وأعواد تنظيف أذن وأسنان	\N	\N	1707	عناية شخصية	كمية	PCS	60	420	7	600	10	فادي الزغير-المحيط الازرق
52be99d9-d066-4176-a3f0-258b3d1c35f1	Toothpicks 2x (1/10)	نكاشات اسنان 2ش (1/10)	\N	\N	170700008	\N	قطن وأعواد تنظيف أذن وأسنان	\N	\N	1707	عناية شخصية	كمية	PCS	10	17	1.7	20	2	فادي الزغير-المحيط الازرق
96cb8cf8-f92c-4da1-8437-df1e5f00cdf0	Paper-coated toothpicks	نكاشات اسنان مغلفة ورق	\N	\N	170700009	\N	قطن وأعواد تنظيف أذن وأسنان	\N	46242857-67e8-4da9-8061-64d245592fa2	1707	عناية شخصية	كمية	PCS	50	250	5	500	10	حامد ناصر الدين
e69eb394-6311-444b-9f7b-c0844d74dfd5	Ear picks (1/100/20)	نكاشات أذن (1/100/20)	\N	\N	170700010	\N	قطن وأعواد تنظيف أذن وأسنان	\N	\N	1707	عناية شخصية	كمية	PCS	20	260	13	400	20	فادي الزغير-المحيط الازرق
25104668-b7ad-4ccb-b5bc-188a0867567a	Biolux Shampoo (400 ml)	شامبو بيولكس (400 مل)	\N	\N	170800001	\N	شامبو وغسول جسم	\N	\N	1708	عناية شخصية	كمية	PCS	12	45	3.75	60	5	الامازون للاستيراد والتسويق
9191370a-baaa-4a43-8603-68e80a9359b4	Hawaiian shampoo	شامبو هاواي	\N	\N	170800002	\N	شامبو وغسول جسم	\N	\N	1708	عناية شخصية	كمية	PCS	12	90	7.5	120	10	مروان عوايصة
63ceb8ff-eaa4-4c03-9d5d-33250a52778c	Sunsilk	صانسيلك	\N	\N	170800003	\N	شامبو وغسول جسم	\N	\N	1708	عناية شخصية	كمية	PCS	1	78	78	120	120	مروان عوايصة
67f8739b-1036-4013-89ec-5ceba41c1e9f	Claire	كلير	\N	\N	170800005	\N	شامبو وغسول جسم	\N	\N	1708	عناية شخصية	كمية	PCS	12	90	7.5	120	10	مروان عوايصة
6bca85f2-944a-4142-ab2b-148ab82fb9b1	Head & Shoulders	هيد آند شولدرز	\N	\N	170800006	\N	شامبو وغسول جسم	\N	\N	1708	عناية شخصية	كمية	PCS	6	63	10.5	90	15	مروان عوايصة
b569f26c-e204-4e97-99c4-e7b0599bd24b	Dettol pieces	ديتول قطع	\N	\N	170900001	\N	صابون قطع	\N	\N	1709	عناية شخصية	كمية	PCS	96	240	2.5	288	3	يونيبال
947d377d-faab-497c-b309-002ed1b3c5cb	Chamomile	بابونج الولد	\N	\N	180100002	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	24	120	5	168	7	سبل للتسويق والتوزيع
6a95e04b-4563-4614-958d-2cc3e0cc8d7b	Good chamomile	بابونج طيبة	\N	\N	180100003	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	36	140	3.89	216	6	الزلموط للتوزيع
fcf286f4-144e-48f1-8a69-1084c3aa022c	Ginger with honey	زنجبيل بالعسل	\N	\N	180100004	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	24	170	7.08	240	10	كونيا
144cb889-593c-4cc9-808f-86a5a0e15fd1	Attar flowers	زهورات العطار	\N	\N	180100005	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	24	144	6	240	10	الاخوة المتحدون
9d3dcbf0-5a9f-478c-a6a7-72b8c2c256ae	Flowers of the Boy (1/24)	زهورات الولد (1/24)	\N	\N	180100006	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	24	135	5.63	168	7	سبل للتسويق والتوزيع
023e499e-02ba-4ccc-a6c2-5e416e1bcf57	Good flowers	زهورات طيبة	\N	\N	180100007	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	36	140	3.89	216	6	الزلموط للتوزيع
f8e9d697-933a-40a9-a5c0-1abfd18c13bd	Spring Green Tea (12/1)	شاي الربيع أخضر (12/1)	\N	\N	180100008	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	12	144	12	180	15	الاخوة المتحدون
dc5558cf-ce69-4e15-b5c5-2b1aff065fa4	Spring Tea is Stronger (1/12)	شاي الربيع أقوى (1/12)	\N	\N	180100009	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	12	135	11.25	180	15	الاخوة المتحدون
634a2f7a-e2d2-4b60-b62d-fe08adcafd5a	Spring Express Tea (1/12)	شاي الربيع إكسبرس (1/12)	\N	\N	180100010	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	12	100	8.33	120	10	الاخوة المتحدون
a3d0f5c1-4d3e-4ddd-8b69-dbec2e5fd691	Lipton tea	شاي ليبتون	\N	\N	180100011	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	36	255	7.08	360	10	الشرق الادنى للتوزيع والتسويق-عنبتاوي
b6c4f700-f341-424d-bdeb-54a858a6e189	Aniseed	يانسون الولد	\N	\N	180100013	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	24	120	5	168	7	سبل للتسويق والتوزيع
887b0530-f7e2-4cf9-9d2d-b3adc777c719	Aniseed Taiba	يانسون طيبة	\N	\N	180100014	\N	شاي وأعشاب ومشروبات ساخنة	\N	\N	1801	مواد غذائية ومشروبات	كمية	PCS	36	140	3.89	216	6	الزلموط للتوزيع
e84561e0-d67d-4849-ba40-6bae58b6cc5d	cappuccino	كابتشينو	\N	\N	180300002	\N	قهوة ومبيضات قهوة	\N	f8c27541-22e6-48a3-ae43-bbd0564a188b	1803	مواد غذائية ومشروبات	كمية	PCS	12	168	14	216	18	المالكي للتجارة والتسويق
44e3bcf2-8df3-4c23-b941-08d820efd4ae	Enough is dead	كافي ميت	\N	\N	180300003	\N	قهوة ومبيضات قهوة	\N	\N	1803	مواد غذائية ومشروبات	كمية	PCS	15	140	9.33	195	13	سبل للتسويق والتوزيع
0f6bda9f-4d30-4b4d-96aa-1c26d7accaec	Marina bleach	مبيض مارينا	\N	\N	180300005	\N	قهوة ومبيضات قهوة	\N	808b1465-8693-4536-a028-1d0ddcb3a628	1803	مواد غذائية ومشروبات	كمية	PCS	12	135	11.25	180	15	مارينا
b56e7725-9d22-45f2-b139-4dfb0279d277	Nescafe	نسكافيه	\N	\N	180300006	\N	قهوة ومبيضات قهوة	\N	808b1465-8693-4536-a028-1d0ddcb3a628	1803	مواد غذائية ومشروبات	كمية	PCS	12	155	12.92	180	15	مارينا
4fc242e0-4791-457b-9a57-e3e7dfefd4da	Nescafe red	نسكافيه أحمر	\N	\N	180300007	\N	قهوة ومبيضات قهوة	\N	\N	1803	مواد غذائية ومشروبات	كمية	PCS	6	114	19	126	21	بالكو
bcba0585-12e0-487b-bf31-44ad4028e4fd	Nescafe fingers	نسكافيه أصابع	\N	\N	180300008	\N	قهوة ومبيضات قهوة	\N	f8c27541-22e6-48a3-ae43-bbd0564a188b	1803	مواد غذائية ومشروبات	كمية	PCS	12	145	12.08	216	18	المالكي للتجارة والتسويق
87e5f988-00cd-4e50-bb23-88cb981ce204	Nescafe fingers	نسكافيه أصابع	\N	\N	180300009	\N	قهوة ومبيضات قهوة	\N	f8c27541-22e6-48a3-ae43-bbd0564a188b	1803	مواد غذائية ومشروبات	كمية	PCS	12	144	12	216	18	المالكي للتجارة والتسويق
b04a499d-7f96-4c1e-b0aa-8decb75b6a76	Nescafe Gold	نسكافيه جولد	\N	\N	180300010	\N	قهوة ومبيضات قهوة	\N	\N	1803	مواد غذائية ومشروبات	كمية	PCS	6	144	24	180	30	محمد مازن
054125e0-86c1-49c5-92db-f55b9e125047	Arwa (1.5 liters)	أروى (1.5 لتر)	\N	\N	180400001	\N	مياه معدنية وعصائر	\N	5fc0026b-89d7-4890-9ca4-42f56d08bd6c	1804	مواد غذائية ومشروبات	كمية	PCS	6	10	1.67	14.1	2.35	شركة المشروبات الوطنية
dd122c73-cd58-412a-94d1-56dbafb595f7	Arwa 330ml (1/24)	أروى 330مل (1/24)	\N	\N	180400002	\N	مياه معدنية وعصائر	\N	5fc0026b-89d7-4890-9ca4-42f56d08bd6c	1804	مواد غذائية ومشروبات	كمية	PCS	24	15	0.63	25.2	1.05	شركة المشروبات الوطنية
07c1c0b4-0c45-48bf-89e3-7c81be15bc4f	Arwa (500 ml)	أروى (500 مل)	\N	\N	180400003	\N	مياه معدنية وعصائر	\N	5fc0026b-89d7-4890-9ca4-42f56d08bd6c	1804	مواد غذائية ومشروبات	كمية	PCS	12	7.5	0.63	15	1.25	شركة المشروبات الوطنية
f435f63e-1f4e-4d5f-80a6-66fcb5d8b14f	Cappy juice	عصير كابي	\N	\N	180400004	\N	مياه معدنية وعصائر	\N	5fc0026b-89d7-4890-9ca4-42f56d08bd6c	1804	مواد غذائية ومشروبات	كمية	PCS	24	35	1.46	48	2	شركة المشروبات الوطنية
a3b2040b-32f9-4ef8-9dae-ab53bc4d975b	Greco Water (200 ml)	مياه جريكو (200 مل)	\N	\N	180400005	\N	مياه معدنية وعصائر	\N	5fc0026b-89d7-4890-9ca4-42f56d08bd6c	1804	مواد غذائية ومشروبات	كمية	PCS	24	10	0.42	15	0.63	شركة المشروبات الوطنية
053f0743-5cdf-4b0e-a3e7-732416805fcd	Meal sugar (packaging)	سكر وجبات (تعبئة)	\N	\N	180500001	\N	مواد تموينية أساسية	\N	\N	1805	مواد غذائية ومشروبات	كمية	PCS	1	35	35	50	50	موون لايت
0e6dcada-151a-4bd9-a2f7-38f9f338c78e	Olive oil (5 kg)	زيت زيتون (5 كغم)	\N	\N	180500002	\N	مواد تموينية أساسية	\N	\N	1805	مواد غذائية ومشروبات	كمية	PCS	1	45	45	100	100	جهاز المخابرات العامة
d0902d36-b68a-4c92-9201-9a5b1e829a8f	Sugar (1 kg)	سكر (1 كغم)	\N	\N	180500003	\N	مواد تموينية أساسية	\N	\N	1805	مواد غذائية ومشروبات	كمية	PCS	10	35	3.5	45	4.5	الاصبح للتجارة العامة والنقليات
3a95e15e-b9ab-475a-9864-76d4c09d9eed	Salt (1 kg)	ملح (1 كغم)	\N	\N	180500004	\N	مواد تموينية أساسية	\N	\N	1805	مواد غذائية ومشروبات	كمية	PCS	12	14	1.17	24	2	الاصبح للتجارة العامة والنقليات
96cf4ba7-f1a1-47ce-826d-91aadf73b636	Meal salt	ملح وجبات	\N	\N	180500005	\N	مواد تموينية أساسية	\N	\N	1805	مواد غذائية ومشروبات	كمية	PCS	1	16	16	20	20	موون لايت
2fdeca38-89fd-4ea6-8970-682a85a7b499	Turkish head (200/1)	تاس راس تركي (200/1)	\N	\N	190100001	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	1	45	45	65	65	فاركو
2343049b-d067-40a5-80d6-247fdc58baf0	Rough head tas (250/1)	تاس راس خشن (250/1)	\N	\N	190100002	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	1	33	33	48	48	موون لايت
bce10728-ad43-4332-81f1-5042b77bb362	Tas Ras Rima	تاس راس ريما	\N	\N	190100003	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	20	88	4.4	100	5	ريما للورق الصحي
f4a86084-a452-42a2-aee8-8622c0f72786	Kimberley Head	تاس راس كمبرلي	\N	\N	190100004	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	1	95	95	140	140	العابودي
c9ec67e0-63e3-4539-ac0a-e14cf25a56a1	Drying (3 kg)	تنشيف (3 كغم)	\N	\N	190100005	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	6	27	4.5	33	5.5	برنس لصناعة الورق الصحي-عارف
01504c09-054e-4ffc-b049-c051c0405083	Industrial roll (5 kg)	رول صناعي (5 كغم)	\N	\N	190100006	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	1	40	40	55	55	الاشهب للتجارة والاستثمار
dca5a4d5-d6f2-4581-8cd4-f097c8734097	Industrial roll (4 kg)	رول صناعي (4 كغم)	\N	\N	190100007	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	1	35	35	45	45	جولف بلاستيك الصناعية
c112fea0-0a3b-4e9b-82dc-58f0098dace7	Industrial roll (1200 meters)	رول صناعي (1200 متر)	\N	\N	190100008	\N	محارم تنشيف	\N	46242857-67e8-4da9-8061-64d245592fa2	1901	منتجات ورقية صحية	كمية	PCS	1	48	48	65	65	حامد ناصر الدين
e13d2cab-d47a-4d75-b3e7-edddfd16d7e9	Industrial roll (3 kg)	رول صناعي (3 كغم)	\N	\N	190100009	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	1	28	28	36	36	زعتر علام -للبلاستيك والنايلون
290224a1-4a4b-4557-82a9-7f13436ccb05	Industrial fabric roll (2 kg)	رول صناعي قماش (2 كغم)	\N	\N	190100010	\N	محارم تنشيف	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	1901	منتجات ورقية صحية	كمية	PCS	1	20	20	25	25	جونسون كلين - نشأت برناط-شركة الزين
64827755-9f5e-45db-a9ac-4fca7378cc5d	Cloth roll (700 g)	رول قماش (700 غرام)	\N	\N	190100011	\N	محارم تنشيف	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	1901	منتجات ورقية صحية	كمية	PCS	12	90	7.5	120	10	جونسون كلين - نشأت برناط-شركة الزين
53ffbd05-c06b-483d-bfd6-e3d910104fd0	Slim Roll	سليم رول	\N	\N	190100012	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	1	90	90	120	120	العابودي
837667e1-baad-4fef-8273-b3133aa2e3f8	Kimberly Electron	كيمبرلي الكتروني	\N	\N	190100013	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	1	170	170	230	230	العابودي
da600790-21f9-430b-8024-390ad0421ea6	Drying papers (6 kg)	محارم تنشيف (6 كغم)	\N	\N	190100014	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	6	50	8.33	66	11	برنس لصناعة الورق الصحي-عارف
8ed4c9df-1588-4042-8cad-2a92a86796e0	Sugar drying tissues	محارم تنشيف سكري	\N	\N	190100015	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	6	14	2.33	20.3	3.38	وليد الشيوخي
76ee98d1-8224-4c18-8b7d-49f8c5ffdf16	Notch Shawl Nylon Napkins (Golf)	محارم نوتش شوال نايلون (جولف)	\N	\N	190100017	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	6	48	8	72	12	جولف بلاستيك الصناعية
15dcfef4-6bd8-4562-9734-134f8086348a	Notch Shawl Nylon Tissues (Farco)	محارم نوتش شوال نايلون (فاركو)	\N	\N	190100018	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	6	55	9.17	78	13	فاركو
154f4efe-f928-4631-99a8-b066294be8e4	Kitchen (1/4)	مطبخ (1/4)	\N	\N	190100019	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	4	7	1.75	10	2.5	الزلموط للتوزيع
8a1ffaaf-4e8f-42b4-baa0-3c45f0572dc9	Notch (4 kg)	نوتتش (4 كغم)	\N	\N	190100020	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	6	50	8.33	63	10.5	فاركو
7964e252-3007-45cd-96d7-99d5b73d5dec	Notch (5 kg carton)	نوتتش (5 كغم كرتون)	\N	\N	190100021	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	6	60	10	75	12.5	فاركو
22f82f3a-93a9-42ed-a8c8-533bf8624c0a	Notch Golf	نوتتش جولف	\N	\N	190100022	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	6	48	8	72	12	جولف بلاستيك الصناعية
901c2b7f-bdd3-465e-aeeb-e55967e3f30c	Notecard	نوتتش كرتون	\N	\N	190100023	\N	محارم تنشيف	\N	\N	1901	منتجات ورقية صحية	كمية	PCS	6	52	8.67	75	12.5	فاركو
f73e1efb-d296-4a58-a8cd-0a4a1869db13	Barney Toilet (18 Rolls)	تواليت بارني (18 رول)	\N	\N	190200001	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	4	84	21	104	26	برنس لصناعة الورق الصحي-عارف
cb455692-5005-4877-8d1a-cad91a1baf43	Fine Toilet (18 Rolls)	تواليت فاين (18 رول)	\N	\N	190200002	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	4	88	22	112	28	شركة جيليت-كولجيت للتوزيع-جعفر
4153d39b-79b4-4173-b6d0-83cd12fc45e9	Toilet (32 rolls)	تواليت (32 رول)	\N	\N	190200005	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	3	57	19	66	22	الزلموط للتوزيع
cccfcbd3-4cae-41b0-a56a-ad33453b10d6	Fine Toilet (3 layers)	تواليت فاين (3 طبقات)	\N	\N	190200006	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	4	90	22.5	112	28	شركة جيليت-كولجيت للتوزيع-جعفر
93a50da2-a65b-4ecb-a7b5-03a1996d6ebf	Toilet (48 rolls - 3.5 kg)	تواليت (48 رول - 3.5 كغم)	\N	\N	190200007	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	1	30	30	38	38	برنس لصناعة الورق الصحي-عارف
63e00ebc-8888-41f1-bcc1-1c895b0321d5	Toilet (9000)	تواليت (9000)	\N	\N	190200008	\N	ورق تواليت	\N	65b1f77e-dd7b-4d9b-b198-35b3fb95a65c	1902	منتجات ورقية صحية	كمية	PCS	1	40	40	65	65	علي درعاوي
dc578832-a476-417a-afd5-16a8713eb177	Jumbo toilet	تواليت جامبو	\N	\N	190200009	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	1	30	30	42	42	برنس لصناعة الورق الصحي-عارف
da499a09-4b3f-4596-a872-c7258eae41a0	Turkish jumbo toilet	تواليت جامبو تركي	\N	\N	190200010	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	1	45	45	55	55	فاركو
aed9430e-57b3-4e3b-952b-965dcdffa565	Jumbo Toilet Pull (4 kg)	تواليت جامبو سحب (4 كغم)	\N	\N	190200011	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	1	57	57	75	75	فاركو
14481580-3a47-4aa3-9e0c-f27106a03dee	Jumbo Kimberley Toilet	تواليت جامبو كمبرلي	\N	\N	190200012	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	1	220	220	250	250	العابودي
cc27317d-8354-4248-9bcc-422a61d830cb	Toilet Remix	تواليت ريمكس	\N	\N	190200013	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	1	24.5	24.5	30	30	ريما للورق الصحي
a61bf557-ae22-4f6c-92fa-0fc48eac2924	Jumbo Control	جامبو كنترول	\N	\N	190200014	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	1	162	162	230	230	العابودي
57a0295f-7d18-47dc-aa65-e875b653711b	Clorox spray	كلوركس بخاخ	\N	\N	210900005	\N	مبيضات (كلور)	\N	\N	2109	مواد تنظيف	كمية	PCS	12	216	18	252	21	كونيا
22cfad6b-adb1-47ab-85b4-ce19d0d71128	Jumbo Sano Pull (6 Rolls)	جامبو سحب سانو (6 رول)	\N	\N	190200015	\N	ورق تواليت	\N	\N	1902	منتجات ورقية صحية	كمية	PCS	1	30	30	55	55	عبد الله بلعاوي
d02226a2-dd88-40fd-a3d6-558a0322f2b4	medical bed sheet	شرشف سرير طبي	\N	\N	190300001	\N	مفروشات طبية ورقية (شراشف)	\N	\N	1903	منتجات ورقية صحية	كمية	PCS	3	23	7.67	45	15	برنس لصناعة الورق الصحي-عارف
ab11adf7-d0ce-4857-98b9-240299bb1f05	Medical bed sheet (1/12)	شرشف سرير طبي (1/12)	\N	\N	190300002	\N	مفروشات طبية ورقية (شراشف)	\N	\N	1903	منتجات ورقية صحية	كمية	PCS	1	150	150	220	220	فاركو
5e4cba63-f571-4c37-b41b-3f7006e8c7f8	wet bucket (good)	سطل مبللة (جيد)	\N	\N	190400001	\N	محارم مبللة	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	1904	منتجات ورقية صحية	كمية	PCS	1	9.5	9.5	15	15	جونسون كلين - نشأت برناط-شركة الزين
3207f594-b581-4edb-9f92-d439ebaee17f	wet bucket (golf)	سطل مبللة (جولف)	\N	\N	190400002	\N	محارم مبللة	\N	\N	1904	منتجات ورقية صحية	كمية	PCS	1	7	7	10	10	جولف بلاستيك الصناعية
0d552cc6-f801-41e6-a583-b74a39ac44a7	Wet wipes (60)	محارم مبللة (60)	\N	\N	190400004	\N	محارم مبللة	\N	\N	1904	منتجات ورقية صحية	كمية	PCS	24	36	1.5	48	2	\N
a4e1a78c-7222-45fb-990f-fc7e1d01817d	Deluxe wet wipes	محارم مبللة DELUX	\N	\N	190400005	\N	محارم مبللة	\N	\N	1904	منتجات ورقية صحية	كمية	PCS	18	40	2.22	63	3.5	الامازون للاستيراد والتسويق
1a2d0dd5-6bab-460a-b17a-9b90f1898e10	Pampers wet wipes	محارم مبللة بامبرز	\N	\N	190400006	\N	محارم مبللة	\N	\N	1904	منتجات ورقية صحية	كمية	PCS	12	50	4.17	60	5	يونيبال
66e173f6-aec2-4d96-b367-b1750d7d5505	Wet tissues (meals)	محارم مبلولة (وجبات)	\N	\N	190400007	\N	محارم مبللة	\N	\N	1904	منتجات ورقية صحية	كمية	PCS	1	70	70	100	100	موون لايت
4f71fd14-5487-4f8e-b1f7-86bef8ec1c64	wet with bombino	مبللة بمبينو	\N	\N	190400010	\N	محارم مبللة	\N	\N	1904	منتجات ورقية صحية	كمية	PCS	24	30	1.25	48	2	تشويس للمنتجات الصحية-choice
7484f2f1-2133-4905-90b4-bcb59fd790e4	Wet Choice	مبللة تشويس	\N	\N	190400011	\N	محارم مبللة	\N	\N	1904	منتجات ورقية صحية	كمية	PCS	24	36	1.5	60	2.5	تشويس للمنتجات الصحية-choice
136544f6-aa98-4433-9c8d-27d2e6f48754	Napkins (40/40)	نابكنز (40/40)	\N	\N	190500001	\N	مناديل طاولة (نابكنز)	\N	\N	1905	منتجات ورقية صحية	كمية	PCS	1	90	90	135	135	فاركو
e2279402-1e0d-4ccf-926d-f66312b21807	Napkins	نابكنز	\N	\N	190500003	\N	مناديل طاولة (نابكنز)	\N	\N	1905	منتجات ورقية صحية	كمية	PCS	30	75	2.5	150	5	فاركو
d506a290-7974-4eaa-9bd8-c31e752b8156	Napkins (107)	نابكنز (107)	\N	\N	190500004	\N	مناديل طاولة (نابكنز)	\N	\N	1905	منتجات ورقية صحية	كمية	PCS	1	65	65	95	95	فاركو
845ddc2d-4b12-4361-b4c7-a1b50eb40f77	Turkish napkins	نابكنز تركي	\N	\N	190500005	\N	مناديل طاولة (نابكنز)	\N	\N	1905	منتجات ورقية صحية	كمية	PCS	24	75	3.13	120	5	فاركو
59310b36-e6eb-44d1-8f9d-59da8b57a374	Disney Napkins	نابكنز ديزني	\N	\N	190500006	\N	مناديل طاولة (نابكنز)	\N	\N	1905	منتجات ورقية صحية	كمية	PCS	1	2	2	3	3	عبد الله بلعاوي
96426196-2bb0-475b-95dd-788ea3945435	Lido Tens	ليدو عشرات	\N	\N	190600001	\N	محارم وجه (علب وجيب)	\N	\N	1906	منتجات ورقية صحية	كمية	PCS	4	39.4	9.85	60	15	شركة جيليت-كولجيت للتوزيع-جعفر
76f87727-44b8-4160-91d9-ff949680b719	Tissues (800 grams)	محارم (800 غرام)	\N	\N	190600002	\N	محارم وجه (علب وجيب)	\N	9751e859-f86b-4f8e-9910-872759456895	1906	منتجات ورقية صحية	كمية	PCS	10	70	7	100	10	حسن عوواده-محلات ليان للمواد للبلاستيكية
b2d07bbc-f595-4fd8-be13-1ed1cc84b35a	Tissues (900 grams)	محارم (900 غرام)	\N	\N	190600003	\N	محارم وجه (علب وجيب)	\N	\N	1906	منتجات ورقية صحية	كمية	PCS	10	85	8.5	100	10	طليب للتجاره والاستثمار
2bced973-bed0-46b7-9050-42588cc7f3ba	Pocket tissues (60/1)	محارم جيب (60/1)	\N	\N	190600004	\N	محارم وجه (علب وجيب)	\N	9751e859-f86b-4f8e-9910-872759456895	1906	منتجات ورقية صحية	كمية	PCS	60	150	2.5	300	5	حسن عوواده-محلات ليان للمواد للبلاستيكية
a8d68706-db0a-494f-bf6a-b5cfdb6922ab	Lian's tissues	محارم ليان	\N	\N	190600005	\N	محارم وجه (علب وجيب)	\N	9751e859-f86b-4f8e-9910-872759456895	1906	منتجات ورقية صحية	كمية	PCS	10	70	7	100	10	حسن عوواده-محلات ليان للمواد للبلاستيكية
a811fbdc-42f9-4774-8354-ddac76315daa	Lisa's tissues	محارم ليزا	\N	\N	190600006	\N	محارم وجه (علب وجيب)	\N	\N	1906	منتجات ورقية صحية	كمية	PCS	10	72	7.2	100	10	فاركو
c8f66a74-7c11-4c6a-865d-1e20db12a41c	Chinese cut tissues (800g - 1/10)	محارم مقطع صيني (800غرام - 1/10)	\N	\N	190600007	\N	محارم وجه (علب وجيب)	\N	9751e859-f86b-4f8e-9910-872759456895	1906	منتجات ورقية صحية	كمية	PCS	10	73	7.3	100	10	حسن عوواده-محلات ليان للمواد للبلاستيكية
af5d7814-a727-428b-9411-3afa0adc301a	cardboard office tissues	محارم مكتب كرتون	\N	\N	190600008	\N	محارم وجه (علب وجيب)	\N	\N	1906	منتجات ورقية صحية	كمية	PCS	30	90	3	150	5	كرم المصري-سما للتجارة العامة
952131bd-d086-435a-967d-3102f8a90731	Lido Soft Tissues (3 pieces - 440 g)	محارم ناعمة ليدو (3قطع - 440 غرام)	\N	\N	190600009	\N	محارم وجه (علب وجيب)	\N	\N	1906	منتجات ورقية صحية	كمية	PCS	20	76	3.8	100	5	شركة جيليت-كولجيت للتوزيع-جعفر
5a928804-63be-4e58-835e-c2e4f24de1ca	Scafi Soft Tissues (800g - 1/10)	محارم ناعمة سكافي (800غرام - 1/10)	\N	\N	190600010	\N	محارم وجه (علب وجيب)	\N	\N	1906	منتجات ورقية صحية	كمية	PCS	10	72	7.2	100	10	الشروق للتوزيع للتجارة-موسى سكافي
869f546a-3bac-459c-9728-d5b7dc369ab8	Fine Fluffy Soft Tissues (1/10 Bag)	محارم ناعمة فاين فلافي (كيس 1/10)	\N	\N	190600011	\N	محارم وجه (علب وجيب)	\N	\N	1906	منتجات ورقية صحية	كمية	PCS	4	90	22.5	120	30	شركة جيليت-كولجيت للتوزيع-جعفر
ce77b1b5-9f2f-4145-a96c-9a6c94379300	Nezo Soft Tissues (kg)	محارم ناعمة نيزو (كغم)	\N	\N	190600012	\N	محارم وجه (علب وجيب)	\N	32afbcb2-43d1-44c2-baf3-4264d6d32218	1906	منتجات ورقية صحية	كمية	PCS	10	85	8.5	120	12	تو بي --شركة TO BE-نزار سعيد
4f458303-9fe3-4969-badb-f5a731470a10	Mickey soft tissues	محارم ناعمة ميكي	\N	\N	190600013	\N	محارم وجه (علب وجيب)	\N	\N	1906	منتجات ورقية صحية	كمية	PCS	10	85	8.5	110	11	برنس لصناعة الورق الصحي-عارف
19007c2d-8184-46b3-a9fe-f8c674519e3f	toilet seat paper	ورق كرسي حمام	\N	\N	190700001	\N	أغطية مقاعد حمامات ورقية	\N	\N	1907	منتجات ورقية صحية	كمية	PCS	1	18	18	25	25	العابودي
d92cb18c-96e7-4d6f-8e89-74ae42851d91	Jawan	جاون	\N	\N	200100001	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	92087359-672f-41cf-8a6c-9a5083d681f7	2001	ملابس ومستلزمات وقاية	كمية	PCS	24	120	5	192	8	غلوبال نورجيل تريندج للمستحضرات الطبية والتجميليه
a86fdadf-92d3-41f3-b601-025639a969ef	Chef hats	طواقي شيف	\N	\N	200100002	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	\N	2001	ملابس ومستلزمات وقاية	كمية	PCS	10	170	17	250	25	كرم المصري-سما للتجارة العامة
37727dcf-a450-49c2-91a5-9d19ee2b2bb9	Aprons	مراييل	\N	\N	200100003	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	\N	2001	ملابس ومستلزمات وقاية	كمية	PCS	10	150	15	280	28	الرحمة للنايلون-وجدي الغانم
3089a77d-835f-4399-abe9-b874c9843912	Yellow cardboard aprons (1/14)	مراييل كرتونة أصفر (1/14)	\N	\N	200100004	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	\N	2001	ملابس ومستلزمات وقاية	كمية	PCS	14	259	18.5	350	25	كرم المصري-سما للتجارة العامة
3d4c64c7-b1cd-406e-9191-6a50dfa74893	Target cleaning gloves	كفوف جلي تارجت	\N	\N	200100005	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	\N	2001	ملابس ومستلزمات وقاية	كمية	PCS	240	480	2	600	2.5	تارجت
2f5a4821-da15-4689-bd9d-9cf39afa146e	golf apron	مريول جولف	\N	\N	200100006	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	\N	2001	ملابس ومستلزمات وقاية	كمية	PCS	10	150	15	200	20	جولف بلاستيك الصناعية
bcf19b15-99e8-4151-9c6d-5878c637f129	heavy duty gloves	كفوف جلي ثقيل	\N	\N	200100007	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	9751e859-f86b-4f8e-9910-872759456895	2001	ملابس ومستلزمات وقاية	كمية	PCS	300	690	2.3	1500	5	حسن عوواده-محلات ليان للمواد للبلاستيكية
b5af10de-6dba-471e-a35c-83afe6a6edff	cheap dishwashing gloves	كفوف جلي رخيص	\N	\N	200100008	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	9751e859-f86b-4f8e-9910-872759456895	2001	ملابس ومستلزمات وقاية	كمية	PCS	300	360	1.2	600	2	حسن عوواده-محلات ليان للمواد للبلاستيكية
c5960ff3-97b8-47f3-a567-a9822c06fa39	Long cleaning gloves	كفوف جلي طويل	\N	\N	200100009	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	9751e859-f86b-4f8e-9910-872759456895	2001	ملابس ومستلزمات وقاية	كمية	PCS	200	560	2.8	1000	5	حسن عوواده-محلات ليان للمواد للبلاستيكية
6fd27b04-9274-4223-8763-ae2d43cbcbe5	Transparent gloves (100/1)	كفوف شفاف (100/1)	\N	\N	200100010	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	2001	ملابس ومستلزمات وقاية	كمية	PCS	100	85	0.85	200	2	الانوار-ابو ععفيفة
e06fcfcf-35da-48e3-bf35-b32c63561ef2	Workers' gloves	كفوف عمال	\N	\N	200100012	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	2001	ملابس ومستلزمات وقاية	كمية	PCS	1	2.5	2.5	5	5	الانوار-ابو ععفيفة
91f412ab-ecfb-4cc9-a729-ea72a94c0dcd	Blue Nitrile Gloves (100 - M/L/S/XL)	كفوف نتريل ازرق (100 - M/L/S/XL)	\N	\N	200100013	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	\N	2001	ملابس ومستلزمات وقاية	كمية	PCS	10	100	10	130	13	تارجت
8d429067-9554-4e96-8b3c-ccdde95c4b4a	Black Nitrile Gloves (100 - M/S/L/XL)	كفوف نتريل أسود (100 - M/S/L/XL)	\N	\N	200100014	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	\N	2001	ملابس ومستلزمات وقاية	كمية	PCS	10	100	10	130	13	تارجت
bf9a66a7-a6e7-4a6e-a6bf-1dba66b8e77a	Masks	كمامات	\N	\N	200100015	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	\N	2001	ملابس ومستلزمات وقاية	كمية	PCS	1	4	4	5	5	تارجت
a5ac692f-1f0e-4dfa-af30-2041bb65233f	Black masks	كمامات أسود	\N	\N	200100016	\N	ملابس وقائية (جاون، مريول، طواقي)	\N	\N	2001	ملابس ومستلزمات وقاية	كمية	PCS	1	4	4	5	5	تارجت
22cd3387-2984-4815-9e2b-6d773d5d3d19	Ajax double glazing	أجاكس زجاج (مزدوج)	\N	\N	210100001	\N	منظفات وملمعات أسطح وزجاج	\N	\N	2101	مواد تنظيف	كمية	PCS	6	95	15.83	120	20	شركة جيليت-كولجيت للتوزيع-جعفر
329d8893-e7e3-4f92-8f57-7092528678d0	Pledge wood polish	بليدج ملمع خشب	\N	\N	210100002	\N	منظفات وملمعات أسطح وزجاج	\N	\N	2101	مواد تنظيف	كمية	PCS	12	72	6	120	10	يونيبال
3566491d-1a1d-4fd2-8c4f-e51031ae6bae	Polo wood polish	بولو ملمع خشب	\N	\N	210100003	\N	منظفات وملمعات أسطح وزجاج	\N	\N	2101	مواد تنظيف	كمية	PCS	12	72	6	96	8	تارجت
f9d3039d-1096-4ff7-a09a-90d01ca42bb8	glass polish	ملمع زجاج	\N	\N	210100004	\N	منظفات وملمعات أسطح وزجاج	\N	\N	2101	مواد تنظيف	كمية	PCS	12	36	3	60	5	مصنع الرحيق
ec0f656c-2f95-4381-bd02-bac9a135e1a3	Glass polish (10 liters)	ملمع زجاج (10 لتر)	\N	\N	210100005	\N	منظفات وملمعات أسطح وزجاج	\N	\N	2101	مواد تنظيف	كمية	PCS	1	18	18	30	30	مصنع الرحيق
1ec18468-d2a6-4e8f-a366-6baf797eae8d	stainless steel polish	ملمع ستانلس	\N	\N	210100006	\N	منظفات وملمعات أسطح وزجاج	\N	\N	2101	مواد تنظيف	كمية	PCS	12	132	11	216	18	مروان عوايصة
1778d6be-cfa3-4e2b-bd56-5a258d488674	3M Stainless Steel Polish	ملمع ستانلس 3M	\N	\N	210100007	\N	منظفات وملمعات أسطح وزجاج	\N	\N	2101	مواد تنظيف	كمية	PCS	12	396	33	540	45	موون لايت
394db189-2157-4ac6-8daf-c7b756f27cb1	parquet polish	ملمع باركيت	\N	\N	210100008	\N	منظفات وملمعات أسطح وزجاج	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	2101	مواد تنظيف	كمية	PCS	6	120	20	150	25	جونسون كلين - نشأت برناط-شركة الزين
8d43a73c-cfb3-4633-99cc-6ebe4ae8e74c	Dettol for hands	ديتول للأيدي	\N	\N	210200001	\N	صابون سائل ورغوة للأيدي	\N	\N	2102	مواد تنظيف	كمية	PCS	12	90	7.5	120	10	التوريدات الطبية
da22d6cd-81ce-4545-b9a1-c6b6afa01536	Foam (2 liters)	رغوة (2 لتر)	\N	\N	210200002	\N	صابون سائل ورغوة للأيدي	\N	\N	2102	مواد تنظيف	كمية	PCS	6	75	12.5	108	18	كرم المصري-سما للتجارة العامة
4fb2b8d5-c3e0-4ee3-bfc0-0fb98b104bf0	Foam bags (1/4)	فوم أكياس (1/4)	\N	\N	210200005	\N	صابون سائل ورغوة للأيدي	\N	\N	2102	مواد تنظيف	كمية	PCS	4	120	30	200	50	فاركو
0234763b-1305-462a-aab9-fd4d7289de14	Kimberley Foam (Liter)	فوم كمبرلي (لتر)	\N	\N	210200006	\N	صابون سائل ورغوة للأيدي	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	2102	مواد تنظيف	كمية	PCS	6	80	13.33	150	25	جونسون كلين - نشأت برناط-شركة الزين
91ba72ed-fa8d-4806-83c2-b66538876801	Lifebuoy	لايف بوي	\N	\N	210200007	\N	صابون سائل ورغوة للأيدي	\N	\N	2102	مواد تنظيف	كمية	PCS	12	151.8	12.65	180	15	الشرق الادنى للتوزيع والتسويق-عنبتاوي
37ab886f-5327-458b-a4ef-5147f5f864ab	Vanish (3 liters)	فانيش (3 لتر)	\N	\N	210300001	\N	مزيلات بقع (ملابس وسجاد)	\N	\N	2103	مواد تنظيف	كمية	PCS	6	126	21	150	25	التوريدات الطبية
2e26c3ab-879c-4c57-a111-3857bdc2d7c4	Vanish Gold (Spray)	فانيش ذهبي (بخاخ)	\N	\N	210300002	\N	مزيلات بقع (ملابس وسجاد)	\N	\N	2103	مواد تنظيف	كمية	PCS	12	132	11	180	15	التوريدات الطبية
0dd995b6-d934-4f62-84fd-c9bf2b10f35a	Vanish Carpet	فانيش سجاد	\N	\N	210300003	\N	مزيلات بقع (ملابس وسجاد)	\N	\N	2103	مواد تنظيف	كمية	PCS	6	48	8	90	15	التوريدات الطبية
bde08090-1858-496b-a1bf-0cf4b5de9064	DDM Dishwashing Liquid (25 L)	DDM سائل جلاية (25 لتر)	\N	\N	210400001	\N	منظفات ومستلزمات غسالات صحون	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	2104	مواد تنظيف	كمية	PCS	1	120	120	330	330	جونسون كلين - نشأت برناط-شركة الزين
3f91215a-4e2f-4082-aeca-f5df993808ef	PL5 Dishwasher Polish (25L)	PL5 ملمع جلاية (25 لتر)	\N	\N	210400002	\N	منظفات ومستلزمات غسالات صحون	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	2104	مواد تنظيف	كمية	PCS	1	140	140	350	350	جونسون كلين - نشأت برناط-شركة الزين
c0860278-0c0c-481e-a914-7b90be32ec96	Dishwasher tablets (64 Quantum)	أقراص جلاية (64 كوانتوم)	\N	\N	210400003	\N	منظفات ومستلزمات غسالات صحون	\N	\N	2104	مواد تنظيف	كمية	PCS	1	35	35	50	50	بالكو
2e8489b6-2311-4b65-ae3d-b7c93794c1ea	Dishwasher oil	زيت جلاية	\N	\N	210400005	\N	منظفات ومستلزمات غسالات صحون	\N	\N	2104	مواد تنظيف	كمية	PCS	12	147	12.25	180	15	التوريدات الطبية
eccffb5c-3e25-4e5c-b439-7767f2fc48f3	Shark Dishwasher Liquid (20 L)	سائل جلاية شارك (20 لتر)	\N	\N	210400006	\N	منظفات ومستلزمات غسالات صحون	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	2104	مواد تنظيف	كمية	PCS	1	120	120	330	330	جونسون كلين - نشأت برناط-شركة الزين
0fb539ee-c0de-4fb3-afeb-15c0523d086e	Dish salt (1.50)	ملح جلاية (1.50)	\N	\N	210400008	\N	منظفات ومستلزمات غسالات صحون	\N	\N	2104	مواد تنظيف	كمية	PCS	12	84	7	120	10	مروان عوايصة
ad0bc2aa-04ce-43e1-9c54-ce28af846cec	Coarse salt (25 kg)	ملح خشن (25 كغم)	\N	\N	210400009	\N	منظفات ومستلزمات غسالات صحون	\N	\N	2104	مواد تنظيف	وزن	كغم	1	30	30	35	35	الاصبح للتجارة العامة والنقليات
71785c00-2122-44f2-ba0d-72637917daf8	Shark Dishwasher Polish (20L)	ملمع جلاية شارك (20 لتر)	\N	\N	210400010	\N	منظفات ومستلزمات غسالات صحون	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	2104	مواد تنظيف	كمية	PCS	1	140	140	350	350	جونسون كلين - نشأت برناط-شركة الزين
6e2745cb-79a2-415e-ba54-25004e0bb849	Finish dishwasher polish	ملمع جلاية فينش	\N	\N	210400011	\N	منظفات ومستلزمات غسالات صحون	\N	\N	2104	مواد تنظيف	كمية	PCS	12	132	11	180	15	التوريدات الطبية
c0563315-cc62-4869-abd9-dcba89f8cb8e	Degreaser (750 ml)	مزيل دهون (750 مل)	\N	\N	210500001	\N	مزيلات دهون وشحوم	\N	\N	2105	مواد تنظيف	كمية	PCS	12	42	3.5	96	8	مصنع الرحيق
59d391a8-6ce5-473a-b278-a4ea0537fbd1	DG720 Degreaser	مزيل دهون DG720	\N	\N	210500002	\N	مزيلات دهون وشحوم	\N	\N	2105	مواد تنظيف	كمية	PCS	1	75	75	100	100	فاركو
6940a386-31ca-43f0-ae94-17f024802c1b	GDA Sanitary Ware Sterilizer	معقم أدوات صحية GDA	\N	\N	210700001	\N	معقمات طبية ومطهرات	\N	\N	2107	مواد تنظيف	كمية	PCS	4	260	65	600	150	بيو سيلاي-حسن كراجه-Bio supply
67a87650-caec-4d32-b1fa-f84104635c61	Ariel 3 kg (1/6)	اريال 3 كغم (1/6)	\N	\N	210800002	\N	غسيل ملابس	\N	\N	2108	مواد تنظيف	كمية	PCS	6	160	26.67	180	30	سبل للتسويق والتوزيع
7b1a4dc0-b559-48e3-b360-acfa8e272ea7	Ariel (8 kg)	اريال (8 كغم)	\N	\N	210800003	\N	غسيل ملابس	\N	\N	2108	مواد تنظيف	كمية	PCS	1	53	53	55	55	سبل للتسويق والتوزيع
3b5cedc0-d0bc-4a1b-977c-8aa79e70273f	Persil (8 kg)	برسيل (8 كغم)	\N	\N	210800004	\N	غسيل ملابس	\N	\N	2108	مواد تنظيف	كمية	PCS	1	32	32	45	45	الامازون للاستيراد والتسويق
61189391-b2fa-4b73-8c74-a7b3bfcd3f31	Tide Bingo (9 kg)	تايد بينجو (9 كغم)	\N	\N	210800005	\N	غسيل ملابس	\N	\N	2108	مواد تنظيف	كمية	PCS	1	32.7	32.7	40	40	الزلموط للتوزيع
924be029-ae2a-43ea-adf8-96493fecb99a	Celit Spray Limescale Remover	سيليت بخاخ مزيل كلس	\N	\N	210800006	\N	غسيل ملابس	\N	\N	2108	مواد تنظيف	كمية	PCS	12	95	7.92	180	15	عبد الله بلعاوي
52f8f08d-8250-4a32-a8a2-c3589e38e3db	Limescale remover (1 liter)	مزيل كلس (1 لتر)	\N	\N	210800007	\N	غسيل ملابس	\N	\N	2108	مواد تنظيف	كمية	PCS	12	96	8	120	10	مصنع الرحيق
560dc402-f52f-4a7e-8ef8-055b93def40e	Runaway	هاربك	\N	\N	210800008	\N	غسيل ملابس	\N	\N	2108	مواد تنظيف	كمية	PCS	12	57.6	4.8	96	8	التوريدات الطبية
48d478c3-b845-45b2-8e97-61bfdd9706d2	Harpic (500 ml)	هاربك (500 مل)	\N	\N	210800009	\N	غsيل ملابس	\N	\N	2108	مواد تنظيف	كمية	PCS	24	115.2	4.8	168	7	التوريدات الطبية
9b4ea0c6-601d-4833-b4e0-4461beb18fe0	Chlorine (3.75 liters)	كلور (3.75 لتر)	\N	\N	210900001	\N	مبيضات (كلور)	\N	\N	2109	مواد تنظيف	كمية	PCS	6	24	4	36	6	مصنع الرحيق
73147b38-2391-4cde-9c5d-9a026bdfe14d	Chlorine 3.75 liters (3%)	كلور 3.75 لتر (3%)	\N	\N	210900002	\N	مبيضات (كلور)	\N	\N	2109	مواد تنظيف	كمية	PCS	6	15	2.5	21	3.5	مصنع الرحيق
765f8411-3fcb-4d50-9d81-1f74f4f42b8b	Chlorine (4 liters)	كلور (4 لتر)	\N	\N	210900003	\N	مبيضات (كلور)	\N	\N	2109	مواد تنظيف	كمية	PCS	6	33	5.5	36	6	مصنع الرحيق
89b1b1fa-c547-45d3-8873-4dd989bb73eb	4 liter crystal chlorine	كلور 4 لتر كريستال	\N	\N	210900004	\N	مبيضات (كلور)	\N	\N	2109	مواد تنظيف	كمية	PCS	6	42	7	54	9	شركة كريستال/مؤيد عوده/فريد عوض
2e7c340e-3b8f-4653-9c0e-42477c832441	Spira tablets	سبيرا أقراص	\N	\N	211000001	\N	مبيدات حشرية وقوارض	\N	\N	2110	مواد تنظيف	كمية	PCS	32	170	5.31	224	7	مروان عوايصة
f4aed192-315d-47ec-b132-0c411b63f8e9	Spira Liquid (double)	سبيرا سائل (زوجي)	\N	\N	211000002	\N	مبيدات حشرية وقوارض	\N	\N	2110	مواد تنظيف	كمية	PCS	24	180	7.5	360	15	مروان عوايصة
fc0b3659-b0eb-4720-a7a8-5a9196653cf5	Raid insecticide	مبيد حشرات ريد	\N	\N	211000003	\N	مبيدات حشرية وقوارض	\N	\N	2110	مواد تنظيف	كمية	PCS	12	96	8	132	11	يونيبال
1edada86-7c7b-487b-8aa1-01cf41654b97	Keltox insecticide	مبيد حشرات كيلتوكس	\N	\N	211000004	\N	مبيدات حشرية وقوارض	\N	\N	2110	مواد تنظيف	كمية	PCS	12	72	6	96	8	تارجت
7fe18da9-4949-4c48-b060-9dfd9d28c028	Ajax (2 liters)	أجاكس (2 لتر)	\N	\N	211100001	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	6	95	15.83	120	20	شركة جيليت-كولجيت للتوزيع-جعفر
1e0677f5-2782-46e2-8624-6fac46f28f99	Ajax Tile (L)	أجاكس بلاط (لتر)	\N	\N	211100002	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	12	96	8	120	10	شركة جيليت-كولجيت للتوزيع-جعفر
c10efa14-da7c-4ab1-ae62-ebc6eb071185	bath stone	حجر حمام	\N	\N	211100003	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	24	140	5.83	240	10	عبد الله بلعاوي
3148a9ea-9d20-4c1c-b575-32cb4d1554e5	Duck Bath Stone	حجر حمام Duck	\N	\N	211100004	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	12	66	5.5	120	10	يونيبال
1134ac7d-720d-47b0-a2ff-c35c10e5652d	Triple bath stone	حجر حمام ثلاثي	\N	\N	211100005	\N	منظفات ومعطرات أرضيات وحمامات	\N	a51df474-5f00-4c87-968f-cec23db5d6ff	2111	مواد تنظيف	كمية	PCS	12	72	6	120	10	واصف البزار
d95f61b1-1634-4cff-825d-340edfb1d001	Triple bath stone (1/24)	حجر حمام ثلاثي (1/24)	\N	\N	211100006	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	24	132	5.5	240	10	عبد الله بلعاوي
5f643844-9fda-4a58-8c74-3a464e25ff4a	Extra Double Bath Stone	حجر حمام ثنائي Extra	\N	\N	211100007	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	9	54	6	90	10	يونيبال
b0a3a9d1-cc9a-4767-b699-858808ea02e7	Dettol Floors (3 L)	ديتول ارضيات (3 لتر)	\N	\N	211100008	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	6	138	23	180	30	التوريدات الطبية
f0c78740-3eb1-4197-8d03-f5f9cbffc5f4	Tile freshener (10 liters)	معطر بلاط (10 لتر)	\N	\N	211100009	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	1	25	25	40	40	مصنع الرحيق
72097ab5-3495-4510-ae2c-e97b8f940db0	Tile freshener (1 liter)	معطر بلاط (1 لتر)	\N	\N	211100010	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	12	36	3	72	6	مصنع الرحيق
ed0835a7-be8c-4fef-bbca-3fc2bfa3ee95	Tile freshener (4 liters)	معطر بلاط (4 لتر)	\N	\N	211100011	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	4	60	15	88	22	مصنع الرحيق
60e90be8-6dda-4814-b76b-326182ca63d6	Perfume tile freshener	معطر بلاط بيرفيوم	\N	\N	211100012	\N	منظفات ومعطرات أرضيات وحمامات	\N	4ac355a5-a9f5-4925-a208-f9e63416f99d	2111	مواد تنظيف	كمية	PCS	12	84	7	144	12	جونسون كلين - نشأت برناط-شركة الزين
92ed2f8a-6385-4e89-8324-a7b412b41718	Nice tile freshener	معطر بلاط نايس	\N	\N	211100013	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	12	80	6.67	120	10	جالا كير لتسويق مواد التنظيف والتجميل
3eb6dec0-1246-4a26-a608-a0b96198435d	Bank freshener	معطر بنك	\N	\N	211100014	\N	منظفات ومعطرات أرضيات وحمامات	\N	\N	2111	مواد تنظيف	كمية	PCS	12	126	10.5	216	18	عبد الله بلعاوي
963ac388-4099-4f53-9c67-db352f3f71ed	Airwick Aquamist	إيرويك أكوامست	\N	\N	211200001	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	12	90	7.5	120	10	التوريدات الطبية
5eda797a-8e87-4e55-8220-e89876272f71	Airwick Liquid	إيرويك سائل	\N	\N	211200002	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	1	90	90	10	10	التوريدات الطبية
12969c13-905e-4fe0-995f-938e51e46625	Earwick Sticks	إيرويك عيدان	\N	\N	211200003	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	5	60	12	75	15	التوريدات الطبية
aeefe276-05b6-4c44-8850-5e25f7e78514	Air Wick Vapor Filling	تعبئة بخار (ايرويك)	\N	\N	211200004	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	6	60	10	90	15	التوريدات الطبية
b3d11324-17de-4175-876f-589970f41145	ice spray	جليد بخاخ	\N	\N	211200005	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	12	42	3.5	60	5	عبد الله بلعاوي
0c7e3138-bb17-4d87-933d-1bda96bd9ab2	Freshmatic filling	فرشماتيك تعبئة	\N	\N	211200006	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	12	111.36	9.28	144	12	التوريدات الطبية
9a47542b-15b6-459c-9576-e4441e0352ee	Glade air freshener	معطر جو جليد	\N	\N	211200007	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	12	42	3.5	96	8	عبد الله بلعاوي
5b144533-3eda-4773-a608-19f7aa4f99fa	Zeta air freshener	معطر جو زيتا	\N	\N	211200008	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	18	72	4	144	8	الزلموط للتوزيع
97664157-0e56-494f-ba44-eb0374c6eb6e	Woods Air Freshener	معطر جو وودز	\N	\N	211200009	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	12	28.5	2.38	42	3.5	تارجت
08f5ae3c-43ba-4a7b-8db0-5b92338fb3a4	Sano air freshener	معطر سانو	\N	\N	211200011	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	12	144	12	216	18	العابودي
603bd1c2-eea8-4d25-90a9-3fc2666824f1	car air freshener	معطر سيارة	\N	\N	211200012	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	1	13	13	18	18	كرم المصري-سما للتجارة العامة
d973d25f-75d6-4519-a0b7-60d008d2065c	Incense sticks	معطر عيدان	\N	\N	211200013	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	1	11	11	15.95	15.95	كرم المصري-سما للتجارة العامة
a6aeeafb-9da4-48c6-a017-d2628f8d84bf	Hazmatik Filling (1/12)	هزماتيك تعبئة (1/12)	\N	\N	211200014	\N	معطرات جو	\N	\N	2112	مواد تنظيف	كمية	PCS	6	45	7.5	60	10	التوريدات الطبية
2b6d38da-a349-4a72-8b51-f63222a458ee	Dettol spray	ديتول بخاخ	\N	\N	211300002	\N	معقمات ومطهرات عامة	\N	\N	2113	مواد تنظيف	كمية	PCS	12	99	8.25	156	13	التوريدات الطبية
7519918b-86f5-4209-ba5c-745e1208244f	Dettol Spray (Yellow/Green/Red/Blue)	ديتول بخاخ (اصفر/اخضر/احمر/ازرق)	\N	\N	211300003	\N	معقمات ومطهرات عامة	\N	\N	2113	مواد تنظيف	كمية	PCS	12	99	8.25	156	13	التوريدات الطبية
38352ac0-0e30-4134-8269-fb3284f5a26b	Dettol Brown (750 ml)	ديتول بني (750 مل)	\N	\N	211300004	\N	معقمات ومطهرات عامة	\N	\N	2113	مواد تنظيف	كمية	PCS	12	156	13	228	19	التوريدات الطبية
f7f424e3-e7f3-4e6e-a26e-2af4f1e15076	Dettol (mold remover)	ديتول (مزيل عفن)	\N	\N	211300005	\N	معقمات ومطهرات عامة	\N	\N	2113	مواد تنظيف	كمية	PCS	6	57	9.5	78	13	التوريدات الطبية
0e2cbba9-b664-4b48-abfd-cfa09ffe2207	High Gel (4 liters)	هاي جل (4 لتر)	\N	\N	211300006	\N	معقمات ومطهرات عامة	\N	\N	2113	مواد تنظيف	كمية	PCS	4	100	25	180	45	مصنع الرحيق
c9adae9b-b3d7-48b4-a72d-71ce91a20217	High Gel (500 ml)	هاي جل (500 مل)	\N	\N	211300007	\N	معقمات ومطهرات عامة	\N	\N	2113	مواد تنظيف	كمية	PCS	12	72	6	120	10	مصنع الرحيق
ed415008-dbbb-4cc1-8920-a452327fa39d	Dettol (1 liter)	ديتول (1 لتر)	\N	\N	211300008	\N	معقمات ومطهرات عامة	\N	\N	2113	مواد تنظيف	كمية	PCS	12	96	8	168	14	مصنع الرحيق
a6eb28ee-2a54-40c7-8397-8c053d6a1dfb	Phonik Love	فونيك حب	\N	\N	211400001	\N	مبيدات قوارض (فونيك)	\N	\N	2114	مواد تنظيف	كمية	PCS	200	700	3.5	1000	5	مروان عوايصة
f0726a3c-705e-4736-94bb-9b649dbebeb3	Tendered Trash Bags (50/50)	أكياس نفايات عطاء (50/50)	\N	\N	220100001	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	50	125	2.5	150	3	الرحمة للنايلون-وجدي الغانم
ddfb3cc6-9d58-49ac-b1ee-435eb3c42357	Garbage bags (70/50 500g)	أكياس نفايات (70/50 سفط 500غم)	\N	\N	220100002	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	80	2.67	150	5	الرحمة للنايلون-وجدي الغانم
ff9dacaa-23c4-4980-9509-7576303755a5	Black Trash Bags (90/75 Suction 500g)	أكياس نفايات أسود (90/75 سفط 500غم)	\N	\N	220100003	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	80	2.67	150	5	الرحمة للنايلون-وجدي الغانم
9c44c063-cc2d-4b0e-8742-a42adf6db51f	Yellow Trash Bags (90/75 Suction 500g)	أكياس نفايات أصفر (90/75 سفط 500غم)	\N	\N	220100004	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	85	2.83	150	5	الرحمة للنايلون-وجدي الغانم
4b8a7dca-a614-426f-a4ca-ffc22928fdca	Garbage bags (90/120 - 25 kg)	اكياس نفايات (90/120 - 25كغم)	\N	\N	220100005	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	وزن	كغم	25	145	5.8	250	10	الرحمة للنايلون-وجدي الغانم
1b03f75d-2823-4f10-989c-f4217f485d0b	Residential waste bags (90/80)	اكياس نفايات سكني (90/80)	\N	\N	220100006	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	وزن	كغم	20	140	7	200	10	الرحمة للنايلون-وجدي الغانم
dbbc671c-796a-4177-bacc-3f315609e5db	Black Roll Trash Bags (50/50 - 350g)	اكياس نفايات رول أسود (50/50 - 350 غم)	\N	\N	220100007	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	40	80	2	160	4	الرحمة للنايلون-وجدي الغانم
c8902149-6a25-4dfe-80a7-522dd6cc5407	Heavy Duty Black Roll Trash Bags (50/50)	اكياس نفايات رول أسود ثقيل (50/50)	\N	\N	220100008	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	40	80	2	160	4	الرحمة للنايلون-وجدي الغانم
e6e32fbb-e9f3-419b-85e9-d23a11e65a1a	Trash bags (50/50 bags)	اكياس نفايات (50/50 سفط)	\N	\N	220100009	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	80	2.67	150	5	الرحمة للنايلون-وجدي الغانم
fcae50b0-b89e-4cb7-be64-801e258b39e9	Yellow Trash Bags (50/50 Safty)	اكياس نفايات اصفر (50/50 سفط)	\N	\N	220100010	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	85	2.83	150	5	الرحمة للنايلون-وجدي الغانم
117e2773-ba00-4855-95dc-99a8d119012c	Black Roll Trash Bags (50/60 - 200 gm)	اكياس نفايات رول أسود (50/60 - 200 غم)	\N	\N	220100011	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	50	90	1.8	200	4	الرحمة للنايلون-وجدي الغانم
d6077578-7ec4-441d-aaba-bd724a53e7a0	Transparent roll garbage bags (50/60 - 200 g)	اكياس نفايات رول شفاف (50/60 - 200 غم)	\N	\N	220100012	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	50	90	1.8	200	4	الرحمة للنايلون-وجدي الغانم
20ece771-8a70-4c8b-9267-44383e8201aa	Yellow Trash Bags (50/70 Safty 500g)	اكياس نفايات أصفر (50/70 سفط 500 غم)	\N	\N	220100013	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	85	2.83	150	5	الرحمة للنايلون-وجدي الغانم
d5fccb10-45ee-4588-a256-69ebee518c44	Black Roll Trash Bags (50/70 - 350 g)	اكياس نفايات رول أسود (50/70 - 350 غم)	\N	\N	220100014	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	40	80	2	160	4	الرحمة للنايلون-وجدي الغانم
5387d710-4c43-4b3d-8bea-1959e7773230	Black Trash Bags (60/60)	اكياس نفايات أسود (60/60)	\N	\N	220100015	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	وزن	كغم	25	140	5.6	200	8	الرحمة للنايلون-وجدي الغانم
6b43b47c-f466-49f4-b98c-2771e76bc0e0	Black Roll Trash Bags (75/90 - 800 g)	اكياس نفايات رول أسود (75/90 - 800 غم)	\N	\N	220100016	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	20	85	4.25	120	6	الرحمة للنايلون-وجدي الغانم
189e686b-909a-4d87-b1ac-3810f64dd820	Yellow roll garbage bags (75/90)	اكياس نفايات رول أصفر (75/90)	\N	\N	220100017	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	85	2.83	150	5	الرحمة للنايلون-وجدي الغانم
715a1c66-2e44-47b5-a1bd-dc9dffb6dc17	White trash bags (75/90 capacity)	اكياس نفايات أبيض (75/90 سفط)	\N	\N	220100018	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	90	3	150	5	الرحمة للنايلون-وجدي الغانم
ea351fb0-cffd-4156-8635-97cd01bd7813	Blue Trash Bags (75/90 Suction)	اكياس نفايات أزرق (75/90 سفط)	\N	\N	220100019	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	90	3	150	5	الرحمة للنايلون-وجدي الغانم
d2792387-05d2-4f6a-a11b-1937f3314b64	Yellow Trash Bags (75/90 Suction)	اكياس نفايات أصفر (75/90 سفط)	\N	\N	220100020	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	90	3	150	5	الرحمة للنايلون-وجدي الغانم
ae546d8b-5007-4ed0-9c13-3bc4954bbe5f	Black Trash Bags (80/120 Safty)	اكياس نفايات أسود (80/120 سفط)	\N	\N	220100021	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	وزن	كغم	20	110	5.5	200	10	الرحمة للنايلون-وجدي الغانم
d4cb1287-77c4-44f7-bbba-4fcf9950d643	Black Trash Bags (90/120 Safty)	اكياس نفايات أسود (90/120 سفط)	\N	\N	220100022	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	وزن	كغم	20	110	5.5	200	10	الرحمة للنايلون-وجدي الغانم
22a30c5c-4a5e-40a5-ae90-3d5d0b06311a	Black Roll Trash Bags (90/75 - 500g)	اكياس نفايات رول أسود (90/75 - 500غم)	\N	\N	220100023	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	80	2.67	150	5	الرحمة للنايلون-وجدي الغانم
50ddfac6-9721-4f4f-b15f-57535c4d131f	Yellow roll garbage bags (90/75 - 15 kg)	اكياس نفايات رول أصفر (90/75 - 15كغم)	\N	\N	220100024	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	85	2.83	150	5	الرحمة للنايلون-وجدي الغانم
6615b8be-9f2e-41c4-be98-f474016c06f7	Blue Roll Trash Bags (90/75)	اكياس نفايات أزرق رول (90/75)	\N	\N	220100025	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	90	3	150	5	الرحمة للنايلون-وجدي الغانم
89b87e75-5943-49b7-8000-48c130a0a48b	Ataa waste bags (90/75 - 800 gm)	اكياس نفايات عطاء (90/75 - 800 غم)	\N	\N	220100027	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	20	115	5.75	150	7.5	الرحمة للنايلون-وجدي الغانم
44277ce5-2442-42df-9ca0-f25365d6556b	Yellow Trash Bags (60/60)	اكياس نفايات أصفر (60/60)	\N	\N	220100028	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	وزن	كغم	25	150	6	250	10	الرحمة للنايلون-وجدي الغانم
e790f586-0e25-4cdd-9eef-12d4808c20eb	Gold Drawstring Trash Bags (65/52)	اكياس نفايات جولد برباط (65/52)	\N	\N	220100029	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	20	100	5	160	8	الرحمة للنايلون-وجدي الغانم
f544ee1e-13ba-411f-883e-a4a750d57a0b	Gold Drawstring Trash Bags (75/90)	اكياس نفايات جولد برباط (75/90)	\N	\N	220100030	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	140	4.67	240	8	الرحمة للنايلون-وجدي الغانم
bc7d1ff6-bb6b-4099-a9eb-d4b5679a31d0	White roll garbage bags (50/50)	اكياس نفايات رول أبيض (50/50)	\N	\N	220100031	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	50	90	1.8	200	4	الرحمة للنايلون-وجدي الغانم
b252e690-b4ac-4a4f-8fd3-80270ed62a1c	Roll garbage bags (500g)	اكياس نفايات رول (500 غم)	\N	\N	220100032	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	30	80	2.67	120	4	الرحمة للنايلون-وجدي الغانم
0ac8a9ea-e93d-455a-ae1c-2463aba5d845	Orange Roll Trash Bags (90/75 - 750g)	اكياس نفايات رول برتقالي (90/75 - 750غم)	\N	\N	220100033	\N	أكياس نفايات	\N	\N	2201	أكياس نايلون وبلاستيك	كمية	PCS	20	85	4.25	140	7	الرحمة للنايلون-وجدي الغانم
e722242f-406b-4b96-9971-3da3703794c5	blue sandwich bags	أكياس ساندويش أزرق	\N	\N	220200001	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	كمية	PCS	50	150	3	250	5	الرحمة للنايلون-وجدي الغانم
18b8eba9-f7e0-4652-9e2e-0bbd24ffb832	Sandwich Bags (150 Bags)	أكياس ساندويش (150 كيس)	\N	\N	220200002	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	كمية	PCS	30	75	2.5	150	5	الرحمة للنايلون-وجدي الغانم
edcb2c09-5559-41e8-91bc-3da8b84de7b6	Freezing roll (5 kg)	رول تفريز (5 كغم)	\N	\N	220200003	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	كمية	PCS	30	38	1.27	75	2.5	الرحمة للنايلون-وجدي الغانم
815b8672-eab3-41b5-b8f6-f8f2ad7c9bd2	dry sandwich roll	رول ساندويش ناشف	\N	\N	220200004	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	كمية	PCS	30	38	1.27	75	2.5	الرحمة للنايلون-وجدي الغانم
95d0f723-89a3-4875-9b41-f2e71803da39	clear box bags	أكياس صندوق شفاف	\N	\N	220200005	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	وزن	كغم	15	115	7.67	150	10	الرحمة للنايلون-وجدي الغانم
ac78bf3b-1516-473d-ae1a-4c17a3966a41	Soft clear bags (8/22)	أكياس طري شفاف (8/22)	\N	\N	220200006	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	كمية	PCS	25	250	10	350	14	الرحمة للنايلون-وجدي الغانم
e723d3f5-7291-456b-aa6f-9811d1ae9b8d	Soft nylon (15/10)	نايلون طري (15/10)	\N	\N	220200007	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	وزن	كغم	30	200	6.67	300	10	الرحمة للنايلون-وجدي الغانم
10fff9e7-b68b-4b76-b205-87483ca22f2f	Soft nylon (25/18)	نايلون طري (25/18)	\N	\N	220200008	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	وزن	كغم	30	200	6.67	300	10	الرحمة للنايلون-وجدي الغانم
8b598072-0009-4e8f-b797-a40e0343e25f	Soft nylon (30/20)	نايلون طري (30/20)	\N	\N	220200009	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	وزن	كغم	30	200	6.67	300	10	الرحمة للنايلون-وجدي الغانم
fbad0bcb-3d07-4983-ae79-3db4c72b5db7	Soft nylon (40/30)	نايلون طري (40/30)	\N	\N	220200010	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	وزن	كغم	30	200	6.67	300	10	الرحمة للنايلون-وجدي الغانم
05b373cc-c251-4262-beda-c316300dfe06	Soft nylon (25/35)	نايلون طري (25/35)	\N	\N	220200011	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	وزن	كغم	30	200	6.67	300	10	الرحمة للنايلون-وجدي الغانم
85ec381c-38fb-43e5-ba3b-b456bfe171de	Soft nylon (25 kg)	نايلون طري (25 كغم)	\N	\N	220200012	\N	أكياس طعام وتفريز	\N	\N	2202	أكياس نايلون وبلاستيك	وزن	كغم	25	170	6.8	250	10	الرحمة للنايلون-وجدي الغانم
a8783697-abe6-413b-acea-a6a9ccaf46e4	Gear bags (one and a half packs)	شنط جير (بكسة ونص)	\N	\N	220300001	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	24	125	5.21	168	7	الرحمة للنايلون-وجدي الغانم
05902694-70bc-42a6-b0b9-32022443633e	40cm white gear bags	شنط جير 40سم أبيض	\N	\N	220300002	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	24	125	5.21	168	7	الرحمة للنايلون-وجدي الغانم
f901efa9-6c7a-48b1-a639-fa9120613812	Gear bags 40cm blue	شنط جير 40سم ازرق	\N	\N	220300003	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	24	125	5.21	168	7	الرحمة للنايلون-وجدي الغانم
325b14cb-98ff-4a0c-935a-5b84b2126641	50cm white gear bags	شنط جير 50سم أبيض	\N	\N	220300004	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	24	125	5.21	168	7	الرحمة للنايلون-وجدي الغانم
1c45ce1d-d095-49a4-9d30-aa1bf8f9723a	50cm blue gear bags	شنط جير 50سم ازرق	\N	\N	220300005	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	24	125	5.21	168	7	الرحمة للنايلون-وجدي الغانم
733810fe-36dd-49a8-a2f6-672bc8ff8fd8	60cm white gear bags	شنط جير 60سم أبيض	\N	\N	220300006	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	24	125	5.21	168	7	الرحمة للنايلون-وجدي الغانم
099a03f0-8433-40d3-90e4-112bd3a6f4f5	60cm blue gear bags	شنط جير 60سم ازرق	\N	\N	220300007	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	24	125	5.21	168	7	الرحمة للنايلون-وجدي الغانم
a3781b30-483c-47ea-86fe-dc0d4f59edc4	70cm blue gear bags	شنط جير 70سم ازرق	\N	\N	220300008	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	24	125	5.21	168	7	الرحمة للنايلون-وجدي الغانم
fe355dd6-12aa-474a-969d-317d9a0c3e68	White Dwarf Gear Bags	شنط جير قزم أبيض	\N	\N	220300009	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	24	125	5.21	168	7	الرحمة للنايلون-وجدي الغانم
6533ca2c-9773-4846-a19a-2417e163681d	24 kg box bags (blue)	شنط بكسة 24كغم (ازرق)	\N	\N	220300010	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	24	125	5.21	168	7	الرحمة للنايلون-وجدي الغانم
0678baa3-b5bf-4148-9c53-05aec19bdf70	40cm counter bags (colorful)	شنط عداد 40 سم (ملون)	\N	\N	220300011	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	15	90	6	120	8	الرحمة للنايلون-وجدي الغانم
848ca274-f119-4df8-8ca1-d85c94b3f54a	50cm counter bags (colorful)	شنط عداد 50 سم (ملون)	\N	\N	220300012	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	15	90	6	120	8	الرحمة للنايلون-وجدي الغانم
14028bc4-553e-45dd-9d11-287c14933aad	60cm counter bags (colorful)	شنط عداد 60 سم (ملون)	\N	\N	220300013	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	15	90	6	120	8	الرحمة للنايلون-وجدي الغانم
5e50b4b5-d45e-47f3-972b-24a2bc01986a	Counter bags (colorful)	شنط عداد بكسة (ملون)	\N	\N	220300014	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	وزن	كغم	15	115	7.67	150	10	الرحمة للنايلون-وجدي الغانم
68d212b2-a87b-4234-a99f-670900c1f632	Gift Bags (No. 2)	أكياس هدايا (رقم 2)	\N	\N	220300018	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	كمية	PCS	20	90	4.5	120	6	الاشهب للتجارة والاستثمار
a5f9e547-6b23-4e4f-8952-8e3f0e173f80	Gift Bags (No. 3)	أكياس هدايا (رقم 3)	\N	\N	220300019	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	كمية	PCS	20	90	4.5	140	7	الاشهب للتجارة والاستثمار
8d2381b2-ce82-4f8b-93bd-984d71fd5657	Gift Bags (No. 4)	أكياس هدايا (رقم 4)	\N	\N	220300020	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	كمية	PCS	20	125	6.25	140	7	الاشهب للتجارة والاستثمار
f8aa3c1f-c647-4b4e-aab3-066867ed917f	Gift Bags (No. 5)	أكياس هدايا (رقم 5)	\N	\N	220300021	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	كمية	PCS	15	135	9	180	12	الاشهب للتجارة والاستثمار
9515d835-e92d-423c-9b9b-444235c20978	Gift Bags (No. 6)	أكياس هدايا (رقم 6)	\N	\N	220300022	\N	أكياس تسوق (شنط)	\N	\N	2203	أكياس نايلون وبلاستيك	كمية	PCS	10	140	14	180	18	الاشهب للتجارة والاستثمار
20098737-f2c5-49af-92a7-f1b93dcc0b92	hamburger skewers	أسياخ همبرغر	\N	\N	230100001	\N	بطاريات	\N	9751e859-f86b-4f8e-9910-872759456895	2301	نثريات ومستهلكات	كمية	PCS	100	280	2.8	700	7	حسن عوواده-محلات ليان للمواد للبلاستيكية
be924d28-1679-457f-b4d5-4ace7f66c321	Batteries	بطاريات	\N	\N	230100002	\N	بطاريات	\N	\N	2301	نثريات ومستهلكات	كمية	PCS	15	13	0.87	30	2	ابو ثائر
80e2c2ba-4000-4a5d-ab79-fa5fcd443d98	Duracell AA batteries	بطاريات دوراسل AA	\N	\N	230100003	\N	بطاريات	\N	\N	2301	نثريات ومستهلكات	كمية	PCS	10	170	17	300	30	يونيبال
3b2d6f48-1698-469a-b818-de1456c5faaf	Duracell AAA batteries	بطاريات دوراسل AAA	\N	\N	230100004	\N	بطاريات	\N	\N	2301	نثريات ومستهلكات	كمية	PCS	24	408	17	720	30	يونيبال
a72bdd82-e6cb-44c2-b67d-e83e7afb467e	Gas filling	تعبئة غاز	\N	\N	230200001	\N	ولاعات وتعبئة غاز	\N	\N	2302	نثريات ومستهلكات	كمية	PCS	12	38	3.17	60	5	تارجت
8f8924c9-8cfa-469d-a796-adfe31fbd0b4	BAIDA Cooker Lighter	ولاعة طباخ BAIDA	\N	\N	230200002	\N	ولاعات وتعبئة غاز	\N	\N	2302	نثريات ومستهلكات	كمية	PCS	24	48	2	84	3.5	العسلي-فيوجن -Fusion Co
ff6bf3c6-a2c5-4785-a961-2e27f3dbb001	Gas filling	تعبئة غاز	\N	\N	230200003	\N	ولاعات وتعبئة غاز	\N	\N	2302	نثريات ومستهلكات	كمية	PCS	12	38	3.17	60	5	ابو ثائر
237c1f3b-a357-4488-b197-c21b71e13980	Shekel lighter	قداحة شيقل	\N	\N	230200004	\N	ولاعات وتعبئة غاز	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	2302	نثريات ومستهلكات	كمية	PCS	100	180	1.8	261	2.61	الانوار-ابو ععفيفة
bb9d3250-cb10-47c6-8c4d-132ac6da2175	Fattash (4/1)	فتاش (4/1)	\N	\N	230300001	\N	فحم ومستلزمات إشعال	\N	\N	2303	نثريات ومستهلكات	كمية	PCS	20	70	3.5	100	5	فادي الزغير-المحيط الازرق
397e4db3-9c00-4cc4-bfb5-2c66ac82aa05	charcoal torch	مشعل فحم	\N	\N	230300002	\N	فحم ومستلزمات إشعال	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	2303	نثريات ومستهلكات	كمية	PCS	24	60	2.5	96	4	الانوار-ابو ععفيفة
9370f1c4-1a63-4978-82b2-523b51088f19	Dried rose (1 kg)	ورد ناشف (1 كغم)	\N	\N	230400001	\N	مستلزمات ديكور وزينة (ورد مجفف)	\N	\N	2304	نثريات ومستهلكات	وزن	كغم	1	14	14	28	28	فادي الزغير-المحيط الازرق
5d97f3ff-091e-41b3-9e0f-4a666b79e84f	Jug (2 liters)	إبريق (2 لتر)	\N	\N	230500001	\N	أوعية منزلية متنوعة	\N	\N	2305	نثريات ومستهلكات	كمية	PCS	1	9	9	15	15	الاستقامة/سنقرط
cc614fa5-d9ea-4b44-8d08-c6aae5ab7089	Jug (4 liters)	إبريق (4 لتر)	\N	\N	230500002	\N	أوعية منزلية متنوعة	\N	\N	2305	نثريات ومستهلكات	كمية	PCS	1	13	13	25	25	الاستقامة/سنقرط
54e49d22-8773-4b57-ae18-343d5a9da5ed	Kettle (6)	غلاية (6)	\N	\N	230500003	\N	أوعية منزلية متنوعة	\N	\N	2305	نثريات ومستهلكات	كمية	PCS	1	3	3	6	6	الاستقامة/سنقرط
e9fc7bf1-e057-455a-87c2-f075c4fe83b5	Kettle (8)	غلاية (8)	\N	\N	230500004	\N	أوعية منزلية متنوعة	\N	\N	2305	نثريات ومستهلكات	كمية	PCS	1	3.5	3.5	8	8	الاستقامة/سنقرط
76dfe9aa-4559-4eaa-9661-6cbac0cfd539	Jar (10 liters)	مرطبان (10 لتر)	\N	\N	230500005	\N	أوعية منزلية متنوعة	\N	\N	2305	نثريات ومستهلكات	كمية	PCS	10	95	9.5	150	15	بلاستيك القدس الصناعية التجارية -الاشمر
1083a429-3869-4e8a-9a6f-a6ede7b66df9	Jar (5 liters)	مرطبان (5 لتر)	\N	\N	230500006	\N	أوعية منزلية متنوعة	\N	\N	2305	نثريات ومستهلكات	كمية	PCS	1	6.75	6.75	12	12	بلاستيك القدس الصناعية التجارية -الاشمر
38902928-02d8-4c11-a6f9-2784795730a6	wooden tongs	ملاقط خشب	\N	\N	230600001	\N	مستلزمات منزلية	\N	\N	2306	نثريات ومستهلكات	كمية	PCS	144	224	1.56	432	3	موبتكس
d093faf3-629d-40d5-9521-7f3c89ef8651	Rose tweezers (16/1)	ملاقط روز (16/1)	\N	\N	230600002	\N	مستلزمات منزلية	\N	\N	2306	نثريات ومستهلكات	كمية	PCS	48	192	4	288	6	تارجت
53b5083e-197b-41f0-a6ae-c057b18521e6	Rose tweezers (20/1)	ملاقط روز (20/1)	\N	\N	230600003	\N	مستلزمات منزلية	\N	\N	2306	نثريات ومستهلكات	كمية	PCS	48	192	4	288	6	تارجت
72c962b4-1fc6-4488-98d1-c24e3fce1133	colored tweezers	ملاقط ملون	\N	\N	230600004	\N	مستلزمات منزلية	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	2306	نثريات ومستهلكات	كمية	PCS	24	36	1.5	60	2.5	الانوار-ابو ععفيفة
ac00820e-b20b-49de-b567-3d69447bd7f9	wooden tongs	ملاقط خشب	\N	\N	230600005	\N	مستلزمات منزلية	\N	d7b240d6-e5e7-413f-ba6f-66ed04503246	2306	نثريات ومستهلكات	كمية	PCS	72	108	1.5	216	3	الانوار-ابو ععفيفة
6c29d561-95bf-488f-b972-ea44749502d8	Rose tweezers	ملاقط روز	\N	\N	230600006	\N	مستلزمات منزلية	\N	\N	2306	نثريات ومستهلكات	كمية	PCS	48	192	4	288	6	تارجت
6eea3bfa-fd3a-4454-a1e1-d6c524868f1e	Stainless steel sink strainer	مصفاة مجلى ستانلس	\N	\N	230600007	\N	مستلزمات منزلية	\N	\N	2306	نثريات ومستهلكات	كمية	PCS	48	432	9	672	14	الاستقامة/سنقرط
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
ifgNCLn6VMFdq5qy-4tCnWxMXUH3DVzv	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-15T20:59:00.051Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "cMNFibNdoiHM5cuP3RBl4ltrcX7xQLni51MtCNfbYQY"}}	2025-10-15 20:59:01
cFQaZlBF3qEL0nBtTqGyWynCbnw_VC7K	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-16T11:08:51.113Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "BVU6h_pK9mpl4GUmoNgmnumUKnII_TgNl5IHiX3Zm_0"}}	2025-10-16 11:08:52
Dl_cgOfBMMJG4HVRRTRCEw0u5iPxfgJG	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-16T11:48:56.281Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "oDrxaQp0k3zKN7uOX3eLlyog_eczNBZph-Y58iOIAMg"}}	2025-10-16 11:48:57
1uupDZiiwahyTQiAob9-QYudZ_E5QOtG	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-16T12:03:19.151Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "xU9r7-1fPUXjhcsGWSvb4CLw6moxG1snzcL7igvwtz4"}}	2025-10-16 12:03:20
DiGNSKUxyw01kj3wQ2I5lTSA_4_ImQ8w	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-17T11:18:43.262Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-17 11:18:44
oyuwTRT-7836VQaUP0BKEWAgYyw917eS	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-17T14:18:23.580Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "vIsxjRclSjKoiO60LBHUnQBFJQdpVY0wBYtCaSMWFnk"}}	2025-10-17 14:25:51
AtNC893Y-uVfoJ9WC3S7yJy8ZTmxDE5y	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-16T22:16:07.808Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "fe0bd286-1d6d-4b63-ab6e-abd17ed05130", "exp": 1760051767, "iat": 1760048167, "iss": "https://replit.com/oidc", "sub": "48458751", "email": "arsalb497@gmail.com", "at_hash": "VTvw_w2nZj0lmxzSy3AHfg", "username": "arsalb497", "auth_time": 1759983887, "last_name": null, "first_name": null}, "expires_at": 1760051767, "access_token": "WpHUuVxsu4yfJKTIapMxrTuY_zbpireaq88asdKxsX4", "refresh_token": "VezG0ahe0aUXuj3EV09-mz74sqVCicih5FI5yHDTlwp"}}}	2025-10-16 22:16:26
xajPmiwbnb9MACBhJQ-gN9gUaSOirUs3	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-16T04:21:30.674Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "0sljX8wXRG4xrXdcixZDSIOwQbGXSMSiShlTb7bOcFA"}}	2025-10-16 04:21:31
DdZuKkLltV9p8CXKIPKsciUhB45b9zI0	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-16T11:40:15.076Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "fe0bd286-1d6d-4b63-ab6e-abd17ed05130", "exp": 1760013614, "iat": 1760010014, "iss": "https://replit.com/oidc", "sub": "48391860", "email": "tahaqadi@gmail.com", "at_hash": "jHINFutOkMOJ3JDBxBMLAg", "username": "tahaqadi", "auth_time": 1760006387, "last_name": "Qadi", "first_name": "Taha"}, "expires_at": 1760013614, "access_token": "-mGI8awhCwC5mmr-FmjPrtMjYrvoeChpVOKpiwTViZ6", "refresh_token": "USKS8ZQtSJW9nrqcX5SpaS42LAhILDUCBIXVISZSNh6"}}}	2025-10-16 12:06:58
I8P4EhscSlmFQ0WcZyglaIp9TSUbpGaa	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-17T18:33:57.077Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "fe0bd286-1d6d-4b63-ab6e-abd17ed05130", "exp": 1760124836, "iat": 1760121236, "iss": "https://replit.com/oidc", "sub": "48391860", "email": "tahaqadi@gmail.com", "at_hash": "ZiqIOhPmV6KDIylBFRgJig", "username": "tahaqadi", "auth_time": 1760088104, "last_name": "Qadi", "first_name": "Taha"}, "expires_at": 1760124836, "access_token": "1PZTbUs3qY9Mau5Aqq-xJgkmR0GsoL9yAiAtnEoEfng", "refresh_token": "8yofQi4fiTDMBvJvVq1KrAG-J533jqBW_CIYNGgUK2h"}}}	2025-10-17 19:02:31
jwnvNk1nSztFC0cRm3WJgcFoxzGaOsxK	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-17T11:18:44.829Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-17 11:18:45
YQOdGeV9tPdC4KgyH2a5-D2qn1CfYBgf	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-17T20:37:17.875Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "fe0bd286-1d6d-4b63-ab6e-abd17ed05130", "exp": 1760132089, "iat": 1760128489, "iss": "https://replit.com/oidc", "sub": "48391860", "email": "tahaqadi@gmail.com", "at_hash": "txM8HHxMSgMjzevDQXQFMA", "username": "tahaqadi", "auth_time": 1760098096, "last_name": "Qadi", "first_name": "Taha"}, "expires_at": 1760132089, "access_token": "pKJ4sdFY_jI19D6J8sGqkp_mwNv6i9YQog6kRK5pPWN", "refresh_token": "F2XK9MORCt3X5_bW38K2-wc6H-cRslfAcFCH_wmpmpZ"}}}	2025-10-17 21:07:20
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at) FROM stdin;
48391860	tahaqadi@gmail.com	Taha	Qadi	\N	2025-10-09 11:16:44.407415	2025-10-10 12:08:18.074
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.vendors (id, vendor_number, name_en, name_ar, contact_email, contact_phone, address, created_at) FROM stdin;
6c4b344c-d619-41da-b5e7-b44468c92509	43	Nour-Bir Nabala Stores	نور-مخازن بير نبالا	\N	\N	\N	2025-10-10 19:57:45.022083
99b7014a-de1f-4260-b896-57f0ef48ef51	46	Palestinian Telecommunications	الاتصالات الفلسطينية	\N	\N	\N	2025-10-10 19:57:45.163869
40f59f81-b24c-4d27-98ea-b665e625deca	53	Twins Computer Services	توينز لخدمات الكميوتر	\N	\N	\N	2025-10-10 19:57:45.294672
7b4e68b9-3a68-4770-8d7f-84fc79c01e5f	54	Mada Al Arab for Public Services	مدى العرب للخدمات العامة	\N	\N	\N	2025-10-10 19:57:45.427116
00f58bfa-a2f6-4ab7-aa86-5f3ebee384db	55	Mohammed Harfoush - Lawyer	محمد حرفوش-المحامي	\N	\N	\N	2025-10-10 19:57:45.557553
feb81724-e7e4-4bd4-8b5b-2cc1c1e0dce4	63	Ramallah and Al-Bireh Chamber of Commerce and Industry	غرفة تجاة وصناعة محافظة رام الله والبيره	\N	\N	\N	2025-10-10 19:57:45.690158
4dafad25-a045-4f34-9f53-0176829a1ef0	65	Peugeot-Autozone Automombile	شركة بيجو-Autozone Automombile	\N	\N	\N	2025-10-10 19:57:45.822031
72ecc710-192d-4aac-97e4-950e02743d5f	66	Marwan/Aluminum	مروان/المنيوم	\N	\N	\N	2025-10-10 19:57:45.952949
3186e986-01c1-435d-a3be-ad8dcc6186ca	67	Najmuddin Zeitoun	نجم الدين زيتون	\N	\N	\N	2025-10-10 19:57:46.089398
3b74eb88-179e-4ab2-8d82-7b60ffd49633	2000131	Rap for consumer goods and cleaning materials	راب للمواد الاستهلاكية و مواد التنظيف	\N	\N	\N	2025-10-10 19:57:46.220584
8a93a14f-11a9-4d2e-b7ba-bf92ab2d6e4e	2000133	The carpenter	النجار	\N	\N	\N	2025-10-10 19:57:46.351064
858cdf80-cf13-4aa4-8f3e-07d678b2ab8d	2000134	Rama Import and Export	راما للاستيراد والتصدير	\N	\N	\N	2025-10-10 19:57:46.480746
5df1829d-82ef-4058-8f4e-a89d70c34872	2000135	Modern Crescent and Star	الهلال والنجمة الحديثة	\N	\N	\N	2025-10-10 19:57:46.611594
17cda5cd-565e-46bd-9c99-ed0fcb8ec4c1	2000136	Hassan Al Sheikh Stores	محلات حسن الشيخ	\N	\N	\N	2025-10-10 19:57:46.744722
f0b8123c-2ca5-4231-826b-56206d3146d6	2000137	Granada for Trade and Manufacturing of Consumer Goods	غرناطة لتجارة وصناعة المواد الاستهلاكية	\N	\N	\N	2025-10-10 19:57:46.875503
7441d52a-a07b-4e3c-9892-446f27ebdd70	2000139	gentrade	جينتريد-gentrade	\N	\N	\N	2025-10-10 19:57:47.007549
5fc0026b-89d7-4890-9ca4-42f56d08bd6c	2000140	National Beverage Company	شركة المشروبات الوطنية	\N	\N	\N	2025-10-10 19:57:47.140049
f9785b00-f41f-4e1e-8ea8-088a7d0f4075	2000141	Al-Silawi, the elite house	السيلاوي بيت النخبه	\N	\N	\N	2025-10-10 19:57:47.270578
92087359-672f-41cf-8a6c-9a5083d681f7	2000145	Global Norgel Trending for Pharmaceuticals and Cosmetics	غلوبال نورجيل تريندج للمستحضرات الطبية والتجميليه	\N	\N	\N	2025-10-10 19:57:47.401709
bce54c31-954e-4b26-b013-f51f4c90fab5	2000147	Narmin-Kofof	نرمين-كفوف	\N	\N	\N	2025-10-10 19:57:47.533592
2e800113-c0dd-4e90-a814-7db6634b1f1b	2000148	Anas Sharaf	انس شرف	\N	\N	\N	2025-10-10 19:57:47.664684
c630b9c6-78f5-4edf-baa3-f50c19b0640a	2000149	Dawoud Stores	محلات داوود	\N	\N	\N	2025-10-10 19:57:47.795348
1f55b4e6-aeb2-4b16-ba5b-731e6a5218ef	2000151	The Golden Lighthouse	المنار الذهبي	\N	\N	\N	2025-10-10 19:57:47.925561
0ac5d08b-e686-40cf-bf5f-87d5ac6e5646	2000152	Al-Shorfa Pharmacy	صيدلية الشرفه	\N	\N	\N	2025-10-10 19:57:48.059441
17c73510-fee2-4cee-afe5-01ffbc425142	2000154	Sanitary Tools Experts	الخبراء للادوات الصحية	\N	\N	\N	2025-10-10 19:57:48.190162
7d992d58-5f5b-49fd-96be-08862f52acaa	2000155	Abdul Qawasmeh	عبد قواسمه	\N	\N	\N	2025-10-10 19:57:48.323437
a95db5ea-769d-4193-9835-a79343093d65	2000157	Green Valley Exhibition	معرض الوادي الاخضر	\N	\N	\N	2025-10-10 19:57:48.454998
218ff76f-332e-42aa-ae1e-08df0864d7ac	2000158	Mahmoud Abu Ghosh	محمود ابو غوش	\N	\N	\N	2025-10-10 19:57:48.585963
6c516ae3-6cbc-413a-959c-d8026f440137	2000159	Bio Protect Supply	بيو بروتكت سابلاي	\N	\N	\N	2025-10-10 19:57:48.716383
aa64468c-fa7f-422f-bd50-2965101e4928	2000161	Tulip brushes	فرش توليب	\N	\N	\N	2025-10-10 19:57:48.847579
36a0af4b-f67c-4d91-990c-b67942734309	2000163	Bin Azhiman	بن ازحيمان	\N	\N	\N	2025-10-10 19:57:48.981245
b50e9e0c-24de-4695-938d-e120cff2f25e	2000164	Hassouna Building Materials	حسونه لمواد البناء	\N	\N	\N	2025-10-10 19:57:49.111995
168c7c6b-8c66-4322-91c7-89716c9f5d96	2000167	Abdul Majeed Abdeen	عبد المجيد عابدين	\N	\N	\N	2025-10-10 19:57:49.241641
39d035ec-feec-4a3a-9ff9-8d6e2ff7e56d	2000168	Five Star General Trading	فايف ستار للتجارة العامة	\N	\N	\N	2025-10-10 19:57:49.372675
f75b081d-4230-4400-83c2-fec489149e76	2000171	Al-Jouri Foodstuffs	الجوري للمواد الغذائية	\N	\N	\N	2025-10-10 19:57:49.505121
9ca6e186-872b-4a00-bd87-6fd550510d46	2000172	Khalil Ayoub Samra - Indian Company	خليل ايو سمره-شركة الهندي	\N	\N	\N	2025-10-10 19:57:49.640113
eefba126-1eb3-474d-acdb-f8cfc9c960e7	2000174	Ben and Spices of Trust - Khalil Abu Samra	بن وبهارات الامانه-خليل ابو سمره	\N	\N	\N	2025-10-10 19:57:49.771379
83b05a59-dbf8-4686-8d50-cb5fa3a532c0	2000176	Canaan Al Nabali General Trading	كنعان النبالي للتجارة العامة	\N	\N	\N	2025-10-10 19:57:49.905364
6c2c4cf1-3c30-4415-8ed3-df42dea81873	2000177	Anbatawi - Global Overseas Company	عنبتاوي-الشركة العالمية لما وراء البحار	\N	\N	\N	2025-10-10 19:57:50.037043
fca34590-2a7c-47e3-bccd-3530d5c1293a	2000179	Guide to the perfume trade	المرشد لتجارة البرفيوم	\N	\N	\N	2025-10-10 19:57:50.170219
ddf203c0-2760-4c82-ba9b-9963bbc2e42f	2000180	Cavello-Mervat El-Haddad	كافيلو-ميرفت الحداد	\N	\N	\N	2025-10-10 19:57:50.301803
a5a71ba9-df15-4fda-8d31-7206eedc216a	2000181	Chise	Chise-شايز	\N	\N	\N	2025-10-10 19:57:50.431965
96f1a100-cdb7-4684-ab0c-ef4dd3c32560	2000183	Sarda Trading and Industry Company	شركة سردا للتجارة والصناعه	\N	\N	\N	2025-10-10 19:57:50.562722
866d4ae1-c1d5-4f35-8aca-5afaade7b6ac	2000184	Virginia Foodstuff Trading	فرجينيا لتجارة المواد الغذائية	\N	\N	\N	2025-10-10 19:57:50.699283
d38f4d50-d16a-4548-a597-a63b41371f4d	2000186	Supply for miscellaneous items	امداد للنثريات	\N	\N	\N	2025-10-10 19:57:50.833952
774ff84e-887e-401b-a012-af6833150a78	2000187	H&M	اتش اند ام	\N	\N	\N	2025-10-10 19:57:50.96869
b8b3eb9a-054c-4924-859e-f5ea7ca9d789	2000191	Masrouji - Balsam	مسروجي- بلسم	\N	\N	\N	2025-10-10 19:57:51.10622
2eb27b3e-b3a4-4b71-95f1-efdd763c603e	2000192	Advantages	مزايا	\N	\N	\N	2025-10-10 19:57:51.245595
a083381d-6ac7-4293-8c36-0b1a0d21d140	2000193	Ziad Fashafsha	زياد فشافشة	\N	\N	\N	2025-10-10 19:57:51.376169
808b1465-8693-4536-a028-1d0ddcb3a628	2024015	Marina	مارينا	\N	\N	\N	2025-10-10 19:57:51.507893
f8c27541-22e6-48a3-ae43-bbd0564a188b	2024021	Al-Maliki Trade and Marketing	المالكي للتجارة والتسويق	\N	\N	\N	2025-10-10 19:57:51.638042
d7b240d6-e5e7-413f-ba6f-66ed04503246	2024024	Al-Anwar - Abu Afifa	الانوار-ابو ععفيفة	\N	\N	\N	2025-10-10 19:57:51.771325
3ad4b1e2-3909-4296-a04c-8eb7dc53815d	2024026	Mohammed Hassouna - Al-Haram Company	محمد حسونه-شركة الحرم	\N	\N	\N	2025-10-10 19:57:51.90186
9751e859-f86b-4f8e-9910-872759456895	2024028	Hassan Awadeh - Lian Stores for Plastic Materials	حسن عوواده-محلات ليان للمواد للبلاستيكية	\N	\N	\N	2025-10-10 19:57:52.03311
c807cbbc-854c-4722-89c9-03e479a2097e	5040077	Palestinian Engineers Union	اتحاد المهندسين الفلسطيني	\N	\N	\N	2025-10-10 19:57:59.903254
e2851020-4158-4b6a-9731-923101fc8be5	2024029	Majed Abu Kharmah - Brothers for Chemical Raw Materials	ماجد ابو خرمة-الاخوة للمواد الاولية الكيماوية	\N	\N	\N	2025-10-10 19:57:52.163341
65b1f77e-dd7b-4d9b-b198-35b3fb95a65c	2024034	Ali Darawi	علي درعاوي	\N	\N	\N	2025-10-10 19:57:52.296826
c41ae732-f165-4e34-ac8f-3abce41e86a7	2024035	Al-Tawil Nylon Stores - Ali Al-Tawil	محلات الطويل لبيع النايلون-علي الطويل	\N	\N	\N	2025-10-10 19:57:52.426708
46242857-67e8-4da9-8061-64d245592fa2	2024041	Hamed Nasser Al-Din	حامد ناصر الدين	\N	\N	\N	2025-10-10 19:57:52.557482
d434411e-afa8-4b8c-9c07-fa3dff420a39	2024045	Jumana Company	شركة جمانه	\N	\N	\N	2025-10-10 19:57:52.688151
49acaee6-8b21-47d7-acee-c530abc6a037	2024047	Arab Jaradat - Sky Service	عريب جرادات-سكاي سيرفس	\N	\N	\N	2025-10-10 19:57:52.821806
7794b3b6-c2f1-4581-8b54-d7d2c93775d6	2024049	Zero-Ramy Al-Awaiwi	زيرو-zero-رامي العويوي	\N	\N	\N	2025-10-10 19:57:52.954892
32afbcb2-43d1-44c2-baf3-4264d6d32218	2024053	TO BE Company - Nizar Saeed	تو بي --شركة TO BE-نزار سعيد	\N	\N	\N	2025-10-10 19:57:53.085775
a2079885-ff32-4603-aad0-7aaf1fb9dc89	2024055	Ulker	اولكر	\N	\N	\N	2025-10-10 19:57:53.215977
c3592908-e56b-4406-ab5c-62fd6b15d851	2024056	Abu Gharbia	ابو غربيه	\N	\N	\N	2025-10-10 19:57:53.347099
99dcab21-395a-4252-aaf1-c97f02a905e8	2100023	Mohammed Zaloum	محمد زلوم	\N	\N	\N	2025-10-10 19:57:53.47943
bbe92c9d-21e2-44e9-bb80-aca0a00da83f	2100042	Sufyan Abu Ras Trading - Mohammed Al-Natsheh	سفيان ابو راس للتجارة-محمد النتشه	\N	\N	\N	2025-10-10 19:57:53.609279
aa0df6dc-69ac-43b3-93f0-3008f364e2dc	2100047	Royal Industrial and Commercial	رويال الصناعية التجارية	\N	\N	\N	2025-10-10 19:57:53.740431
a51df474-5f00-4c87-968f-cec23db5d6ff	2100050	Wassef Al-Bazzar	واصف البزار	\N	\N	\N	2025-10-10 19:57:53.873729
853b6e91-c6c5-4bfd-b872-35b2bcfb23ac	2100053	Al-Burhan for Trading and Manufacturing Cleaning Materials	البرهان لتجارة وصناعة مواد التنظيف	\N	\N	\N	2025-10-10 19:57:54.004725
43acdee6-642a-4288-9bbc-befaa960e1da	2100061	Rawan Sanitary Paper Manufacturing Company	مؤسسة روان لصناعه الورق الصحي	\N	\N	\N	2025-10-10 19:57:54.135528
5a9e2165-e15e-49c3-93db-a97b3b6c4d8f	2100062	Tobol stores selling all kinds of nylon	محلات الطوبل لبيع جميع انواع النايلون	\N	\N	\N	2025-10-10 19:57:54.267605
74574a0d-17a3-4b02-bd58-578b3c79681e	2100063	Wafa Company	شركة وفا	\N	\N	\N	2025-10-10 19:57:54.39787
b8dd59fa-d557-4ee7-84cb-5bfa289fd3da	3010104	Department of Refugee Affairs	دائرة شؤون اللاجئين	\N	\N	\N	2025-10-10 19:57:54.529093
01ae002a-2506-46e8-88f8-749173c5bc08	4000216	Abu Saleh Al-Malouli/Bernbala	ابو صالح الملولي/ بيرنبالا	\N	\N	\N	2025-10-10 19:57:54.66292
d1a5ffe3-5aaf-4f7d-a703-9c2fb2d779d9	4000221	Rawabi Municipality	بلدية روابي	\N	\N	\N	2025-10-10 19:57:54.794213
902be612-11b8-4bb1-b2d5-e212df6964b4	5010030	PECDAR - Palestinian Economic Council	بكدار -المجلس الاقتصادي الفلسطيني	\N	\N	\N	2025-10-10 19:57:54.924573
8aeebc4f-b361-42e5-8fb1-6fafa392e02e	5010031	Top Clean	توب كلين	\N	\N	\N	2025-10-10 19:57:55.057165
0c387869-d51a-4c65-b666-b6a0b16ed5f2	5010035	Bal Clean	بال كلين	\N	\N	\N	2025-10-10 19:57:55.189986
e3440b8e-e70b-48bf-8814-ac8d728fd6d8	5010050	Bal Power - Environmental Services - Marathon Technology	بال بور - الخدمات البيئية- ماراثون لتكنولوجيا	\N	\N	\N	2025-10-10 19:57:55.335249
22c67365-58ba-48a5-8f32-62b0c8b2e3e4	5010101	Al-Quds University - Abu Dis	جامعة القدس - أبو ديس	\N	\N	\N	2025-10-10 19:57:55.464545
aa69ab84-0417-4511-ba0d-dc0e09207aee	5010108	Yahya Youssef Idris	يحيى يوسف ادريس	\N	\N	\N	2025-10-10 19:57:55.595516
09c93656-f266-4bf1-b42d-8d8bb4ffa0b3	5010113	Stia Import and Export	ستيا للاستيراد والتصدير	\N	\N	\N	2025-10-10 19:57:55.726254
a9b6d17a-1fbe-49a1-8862-7397a9c20709	5010118	Adel Al-Qadi	عادل القاضي	\N	\N	\N	2025-10-10 19:57:55.857256
a9849419-6c10-436b-8c63-a8cc23485cc7	5010119	Recordo Cafe	ريكوردو كافيه	\N	\N	\N	2025-10-10 19:57:55.98832
703af280-4341-4e46-b274-cb0df157cf22	5010137	Mohammed Doleh	محمد دولة	\N	\N	\N	2025-10-10 19:57:56.117736
e3182063-3c0f-418d-92e7-b806124a9938	5010139	Shox	شوكس	\N	\N	\N	2025-10-10 19:57:56.249012
68398adf-0e80-4f22-8272-573f736bfd60	5020005	Issam Al-Adasi	عصام العداسي	\N	\N	\N	2025-10-10 19:57:56.379357
4ac355a5-a9f5-4925-a208-f9e63416f99d	5020009	Johnson Clean - Nashat Burnat - Al Zain Company	جونسون كلين - نشأت برناط-شركة الزين	\N	\N	\N	2025-10-10 19:57:56.566838
0be9728a-be3d-447b-81d4-3bb0f6bae8fa	5020021	Al Amal Fuel Station	محطة الامل للمحروقات	\N	\N	\N	2025-10-10 19:57:56.70125
fe4284d5-88cd-4a3a-80b3-214475024b8b	5020022	Abu Sand	ابو سند	\N	\N	\N	2025-10-10 19:57:56.83114
3c23a212-ff56-41f8-9ba5-532090932bc3	5020029	Kazom	كزوم	\N	\N	\N	2025-10-10 19:57:56.964631
eec05105-adb3-47cb-ac31-f74f689b1066	5020043	Hamdan Salah al-Din	حمدان صلاح الدين	\N	\N	\N	2025-10-10 19:57:57.095258
1787ccb4-c213-4c68-a863-567ea213f483	5020046	Abu Luay's falafel	فلافل ابو لؤي	\N	\N	\N	2025-10-10 19:57:57.228728
3173846c-f00b-4769-bbd1-77663c3ce0c7	5020057	Fruitella / Murad	فروتيلا / مراد	\N	\N	\N	2025-10-10 19:57:57.360508
9af8628e-abcb-440c-857d-a9b25766e7ad	5020062	Hani Daoud	هاني داوود	\N	\N	\N	2025-10-10 19:57:57.497453
9a161c76-58cd-487e-a892-34e38c8e7a48	5020063	Dolce Aroma	Dolce Aroma- دولتشي أروما	\N	\N	\N	2025-10-10 19:57:57.645789
3a167ea9-76fc-44cb-b4c2-894a1b99ff0f	5020067	White White Company	شركة أبيض أبيض	\N	\N	\N	2025-10-10 19:57:57.782696
1100249f-3133-4a86-802a-75a0e89cf314	5020069	Wasil Company	شركة واصل	\N	\N	\N	2025-10-10 19:57:57.913376
0d7b7394-4e61-454b-bf4f-c80f7a62bcdb	5020073	Ayad Al-Ajouli	اياد العجولي	\N	\N	\N	2025-10-10 19:57:58.044618
35f13a15-268a-4321-9246-8e80ed6afa5f	5020074	Khaled Mazloum	خالد مظلوم	\N	\N	\N	2025-10-10 19:57:58.17552
be673474-6df3-48c1-ae20-46176bb4d022	5020075	Mohamed Badawi	محمد بدوي	\N	\N	\N	2025-10-10 19:57:58.30601
45147975-16cf-4bea-9fb2-74c7c23e9a32	5020080	The Wise One Package	الحكماء-ون باكج	\N	\N	\N	2025-10-10 19:57:58.437057
d1af28be-5d6f-4c00-bae1-54dd0075f4c7	5030007	Rafidia Governmental Hospital	مستشفى رفيديا الحكومي	\N	\N	\N	2025-10-10 19:57:58.570556
65687608-5043-4fcf-b4b6-5ddc82f8954b	5030040	Jericho Governmental Hospital	مستشفى اريحا الحكومي	\N	\N	\N	2025-10-10 19:57:58.701076
05385326-5930-439d-9ee9-e727aaeac88b	5030048	Salfit Governmental Hospital	مستشفى سلفيت الحكومي	\N	\N	\N	2025-10-10 19:57:58.83206
e6a0606f-6177-40e0-939d-2a72430bf769	5040022	Yahya Mahmoud Abu Fakhida - New	يحيى محمود ابو فخيدة -جديد	\N	\N	\N	2025-10-10 19:57:58.963227
be377a67-c686-423f-9821-3861e0af7c50	5040023	Mohammed Hadidoun	محمد حديدون	\N	\N	\N	2025-10-10 19:57:59.09496
39dfa7a7-1e4c-4a2e-bd6a-4db08ee1d03a	5040024	Ahmed Suleiman - National	احمد سليمان-الوطنية	\N	\N	\N	2025-10-10 19:57:59.237736
dfd62f4e-2b7a-41e1-85e6-b4d66ea51435	5040043	Mohammed Abu Shalbak	محمد ابو شلبك	\N	\N	\N	2025-10-10 19:57:59.368499
b2567517-8be2-487e-9532-7d7d0dad236c	5040047	Al-Baraq Company	شركة البريق	\N	\N	\N	2025-10-10 19:57:59.508597
4b45e639-973a-4d2c-9d5d-0ac1a35ce761	5040049	Horizon Company	شركة الأفق	\N	\N	\N	2025-10-10 19:57:59.63955
647d220f-f215-4191-8c58-e40df937b604	5040062	Samba Cafe	سامبا كافيه	\N	\N	\N	2025-10-10 19:57:59.772267
b2343b18-ac9d-4485-9706-956af7a6a7bf	5040079	Jasmine Cafe	جاسمين كافيه	\N	\N	\N	2025-10-10 19:58:00.036764
dad28145-c1c0-4400-ba09-7098cde7d0db	5040089	we effect	we effect	\N	\N	\N	2025-10-10 19:58:00.173361
f20d9909-f422-4a9a-a962-c1d80def5fd9	5040109	Anas Shiha	انس شيحة	\N	\N	\N	2025-10-10 19:58:00.306212
ce11192f-8ac6-4df1-a988-3b97b2667288	5040110	Tekiya Umm Abdullah	تكية أم عبد الله	\N	\N	\N	2025-10-10 19:58:00.438588
fce79d63-2ec9-4b4b-9447-6212d4f0c55f	5040127	Mix It	Mix It	\N	\N	\N	2025-10-10 19:58:01.313063
9881356d-af32-4891-ad26-2d0b8870259e	5040136	Qatar Dew Company	شركة قطر الندى	\N	\N	\N	2025-10-10 19:58:01.945919
5e5900b8-6f13-4e70-9ab7-549950a597cf	5050052	Iyad Abu Ghuwaila	اياد ابو غويلة	\N	\N	\N	2025-10-10 19:58:02.080866
14ae4822-8256-4757-8242-47addfef1f87	5050053	Judge Foundation - Mahmoud Ali Judge Abu Al-Baraa	مؤسسة القاضي-محمود علي القاضي ابو البراء	\N	\N	\N	2025-10-10 19:58:02.214479
ea1ef8fc-7dbf-4dc0-bfb3-e1b84bef8171	9000008	Usable	قابل للاستخدام	\N	\N	\N	2025-10-10 19:58:02.35038
c21e43ec-4f7e-4691-9352-181580f0a72a	9000038	Usable	قابل للستخدام	\N	\N	\N	2025-10-10 19:58:02.481247
5745a450-96f7-4874-bbc0-096ef2583bad	1	Miscellaneous	متفرقات	\N	\N	\N	2025-10-10 19:58:02.612606
f7968a70-1f0c-4f73-b28b-0c9727c6ed83	2	Settlement of financial statements	تسوية قوائم مالية	\N	\N	\N	2025-10-10 19:58:02.745309
fda0e89e-964c-4337-8a71-e8c705f4c515	3	Income Tax Department - Ramallah	دائرة ضريبة الدخل -رام رالله	\N	\N	\N	2025-10-10 19:58:02.996494
b199012d-a89b-4a7e-b54e-f3b1744ac273	4	Describe its oil	وصفي زيته	\N	\N	\N	2025-10-10 19:58:03.132022
9825eb6f-26e9-4406-a9c8-6c8e6b3d7e49	5	Value Added Tax Department - Ramallah	دائرة الضريبة المضافة -رامرالله	\N	\N	\N	2025-10-10 19:58:03.262318
9f186df2-69ea-4364-a879-92b977b694a0	34	Bank of Palestine	بنك فلسطين	\N	\N	\N	2025-10-10 19:58:03.394192
d8023d06-8f22-4c09-93a9-50d8c089af4f	36	cell phone	جوال	\N	\N	\N	2025-10-10 19:58:03.523958
d6003a78-3098-4b5b-b85e-2e36071524b5	41	Nasser Aql	ناصر عقل	\N	\N	\N	2025-10-10 19:58:03.654443
761a7307-e99e-4ba1-8fd4-ce4f93e62428	42	Khalil Rizk Auditing Office	مكتب خليل رزق للتدقيق	\N	\N	\N	2025-10-10 19:58:03.785354
2718de5e-2c64-4c4e-a07e-5c66fb066289	2000001	Soft Line	سوفت لاين	\N	\N	\N	2025-10-10 19:58:03.924501
a516d5ee-957b-4776-9814-230e2711fd28	2000002	Unifood	يونيفوود	\N	\N	\N	2025-10-10 19:58:04.060154
\.


--
-- Name: client_departments client_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_departments
    ADD CONSTRAINT client_departments_pkey PRIMARY KEY (id);


--
-- Name: client_locations client_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_locations
    ADD CONSTRAINT client_locations_pkey PRIMARY KEY (id);


--
-- Name: client_pricing client_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_pricing
    ADD CONSTRAINT client_pricing_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: clients clients_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_unique UNIQUE (user_id);


--
-- Name: clients clients_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_username_unique UNIQUE (username);


--
-- Name: lta_clients lta_clients_lta_id_client_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lta_clients
    ADD CONSTRAINT lta_clients_lta_id_client_id_unique UNIQUE (lta_id, client_id);


--
-- Name: lta_clients lta_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lta_clients
    ADD CONSTRAINT lta_clients_pkey PRIMARY KEY (id);


--
-- Name: lta_products lta_products_lta_id_product_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lta_products
    ADD CONSTRAINT lta_products_lta_id_product_id_unique UNIQUE (lta_id, product_id);


--
-- Name: lta_products lta_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lta_products
    ADD CONSTRAINT lta_products_pkey PRIMARY KEY (id);


--
-- Name: ltas ltas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ltas
    ADD CONSTRAINT ltas_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_templates order_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_templates
    ADD CONSTRAINT order_templates_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_vendor_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_vendor_number_key UNIQUE (vendor_number);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: lta_clients lta_clients_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lta_clients
    ADD CONSTRAINT lta_clients_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: lta_clients lta_clients_lta_id_ltas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lta_clients
    ADD CONSTRAINT lta_clients_lta_id_ltas_id_fk FOREIGN KEY (lta_id) REFERENCES public.ltas(id) ON DELETE RESTRICT;


--
-- Name: lta_products lta_products_lta_id_ltas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lta_products
    ADD CONSTRAINT lta_products_lta_id_ltas_id_fk FOREIGN KEY (lta_id) REFERENCES public.ltas(id) ON DELETE RESTRICT;


--
-- Name: lta_products lta_products_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lta_products
    ADD CONSTRAINT lta_products_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: orders orders_lta_id_ltas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_lta_id_ltas_id_fk FOREIGN KEY (lta_id) REFERENCES public.ltas(id) ON DELETE RESTRICT;


--
-- Name: products products_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

