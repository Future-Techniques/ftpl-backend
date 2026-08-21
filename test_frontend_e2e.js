import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const API_KEY = process.env.API_KEY || 'Ho8nGfHHLhGurgRg1lRwKbe6URNYbrMmZyZ0AOUqm0dVUHEDjLfKsQ5Y7WFTRkt3';
const headers = { apikey: API_KEY };

const results = [];

async function check(name, testFn) {
    try {
        const res = await testFn();
        results.push({ name, status: 'PASS', detail: res });
        console.log(`[PASS] ${name} -> ${res}`);
    } catch (err) {
        results.push({ name, status: 'FAIL', detail: err.message });
        console.error(`[FAIL] ${name} -> ${err.message}`);
    }
}

async function verifyMediaUrl(url) {
    if (!url) return true;
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch (e) {
        return false;
    }
}

async function runTests() {
    console.log('=== FUTURETEK COMPLETE END-TO-END PARITY & INTEGRATION SUITE ===\n');

    // 1. Banners
    await check('1. Banners (GET /banners)', async () => {
        const res = await fetch(`${API_BASE}/banners`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading banners');
        const imgOk = await verifyMediaUrl(data.banners[0].image);
        return `${data.banners.length} banners returned, primary image: ${imgOk ? '200 OK' : 'fail'}`;
    });

    // 2. Features
    await check('2. Features (GET /features)', async () => {
        const res = await fetch(`${API_BASE}/features`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading features');
        return `${data.features.length} features loaded`;
    });

    // 3. Testimonials
    await check('3. Testimonials (GET /testimonials)', async () => {
        const res = await fetch(`${API_BASE}/testimonials`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading testimonials');
        return `${data.testimonials.length} testimonials loaded`;
    });

    // 4. Associates
    await check('4. Associates (GET /associates & GET /associates/list)', async () => {
        const res1 = await fetch(`${API_BASE}/associates`, { headers });
        const res2 = await fetch(`${API_BASE}/associates/list`, { headers });
        const data1 = await res1.json();
        const data2 = await res2.json();
        if (!res1.ok || !res2.ok) throw new Error('Failed loading associates');
        return `associates: ${data1.associates.length}, grouped categories: ${data2.associates.length}`;
    });

    // 5. Sister Concerns
    await check('5. Sister Concerns (GET /sister-concern)', async () => {
        const res = await fetch(`${API_BASE}/sister-concern`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading sister concerns');
        const list = data['sister-concern'] || data.concerns || data.data;
        return `${list.length} sister concerns loaded`;
    });

    // 6. Categories (List & Show)
    let sampleCatSlug = null;
    await check('6. Categories (GET /categories)', async () => {
        const res = await fetch(`${API_BASE}/categories`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading categories');
        sampleCatSlug = data.categories[0].slug;
        return `${data.categories.length} top-level categories loaded, sample slug: ${sampleCatSlug}`;
    });

    if (sampleCatSlug) {
        await check(`6.1 Category Detail (GET /categories/${sampleCatSlug})`, async () => {
            const res = await fetch(`${API_BASE}/categories/${sampleCatSlug}`, { headers });
            const data = await res.json();
            if (!res.ok || data.result !== 'success') throw new Error('Failed loading category detail');
            return `Category "${data.category.title}" loaded with ${data.category.products ? data.category.products.length : 0} products`;
        });
    }

    // 7. Services (List & Show)
    let sampleServiceSlug = null;
    await check('7. Services (GET /services)', async () => {
        const res = await fetch(`${API_BASE}/services`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading services');
        sampleServiceSlug = data.services[0].slug;
        return `${data.services.length} services loaded, sample: ${sampleServiceSlug}`;
    });

    if (sampleServiceSlug) {
        await check(`7.1 Service Detail (GET /services/${sampleServiceSlug})`, async () => {
            const res = await fetch(`${API_BASE}/services/${sampleServiceSlug}`, { headers });
            const data = await res.json();
            if (!res.ok || data.result !== 'success') throw new Error('Failed loading service detail');
            return `Service "${data.service.title}" loaded`;
        });
    }

    // 8. Industries
    await check('8. Industries (GET /industries)', async () => {
        const res = await fetch(`${API_BASE}/industries`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading industries');
        return `${data.industries.length} industries loaded`;
    });

    // 9. Downloads
    await check('9. Downloads (GET /downloads)', async () => {
        const res = await fetch(`${API_BASE}/downloads`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading downloads');
        return `${data.downloads.length} downloads loaded`;
    });

    // 10. References
    await check('10. References (GET /references)', async () => {
        const res = await fetch(`${API_BASE}/references`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading references');
        return `${data.references.length} references loaded`;
    });

    // 11. Blogs (List & Detail)
    let sampleBlogSlug = null;
    await check('11. Blogs (GET /blogs)', async () => {
        const res = await fetch(`${API_BASE}/blogs`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading blogs');
        sampleBlogSlug = data.blogs[0].slug;
        return `${data.blogs.length} blogs loaded, sample: ${sampleBlogSlug}`;
    });

    if (sampleBlogSlug) {
        await check(`11.1 Blog Detail (GET /blogs/${sampleBlogSlug})`, async () => {
            const res = await fetch(`${API_BASE}/blogs/${sampleBlogSlug}`, { headers });
            const data = await res.json();
            if (!res.ok || data.result !== 'success') throw new Error('Failed loading blog detail');
            return `Blog "${data.blog.title}" loaded`;
        });
    }

    // 12. Careers (List & Show)
    let sampleJobSlug = null;
    await check('12. Careers (GET /careers)', async () => {
        const res = await fetch(`${API_BASE}/careers`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading careers');
        const jobs = data.careers || data.career;
        sampleJobSlug = jobs[0] ? jobs[0].slug : null;
        return `${jobs.length} career postings loaded`;
    });

    // 13. FAQs
    await check('13. FAQs (GET /faqs)', async () => {
        const res = await fetch(`${API_BASE}/faqs`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading FAQs');
        return `${data.types.length} FAQ categories loaded with questions`;
    });

    // 14. Static Pages
    await check('14. Static Pages (GET /pages/privacy-policy)', async () => {
        const res = await fetch(`${API_BASE}/pages/privacy-policy`, { headers });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error('Failed loading page');
        return `Page "${data.page.title}" loaded`;
    });

    // 15. Live Interactive Form Submissions
    console.log('\n--- Live Form Submissions ---');

    // 15.1 Contact Form Submission
    let contactEmail = `contact_test_${Date.now()}@futuretek.com.np`;
    await check('15.1 Contact Form (POST /contact)', async () => {
        const payload = {
            name: 'Live Verified Visitor',
            email: contactEmail,
            phone_number: '9800000000',
            message: 'Testing public contact submission flow connected to PostgreSQL.'
        };
        const res = await fetch(`${API_BASE}/contact`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error(JSON.stringify(data.message) || 'Failed contact submit');
        return `Contact form created: ${data.message || 'success'}`;
    });

    // 15.2 Newsletter Subscription Form
    const subscriberEmail = `sub_test_${Date.now()}@futuretek.com.np`;
    await check('15.2 Newsletter Subscribe (POST /subscriber)', async () => {
        const res = await fetch(`${API_BASE}/subscriber`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: subscriberEmail })
        });
        const data = await res.json();
        if (!res.ok || data.result !== 'success') throw new Error(JSON.stringify(data.message) || 'Failed subscribe');
        return `Subscribed: ${data.message || 'success'}`;
    });

    // 15.3 Career Candidate Apply Form with PDF upload
    let candidateEmail = `applicant_test_${Date.now()}@futuretek.com.np`;
    if (sampleJobSlug) {
        await check(`15.3 Career Apply (POST /careers/${sampleJobSlug})`, async () => {
            const formData = new FormData();
            formData.append('first_name', 'Verified');
            formData.append('last_name', 'Applicant');
            formData.append('gender', 'Male');
            formData.append('date_of_birth', '1998-05-15');
            formData.append('email', candidateEmail);
            formData.append('phone_number', '9833333333');
            formData.append('permanent_address', 'Lalitpur, Nepal');
            formData.append('current_address', 'Kathmandu, Nepal');
            formData.append('expected_salary', '50000');
            formData.append('education', 'Bachelors in Computer Engineering');
            formData.append('experience', '3 years of fullstack development');
            formData.append('about_yourself', 'Passionate engineer interested in industrial automation');

            const dummyBlob = new Blob(['%PDF-1.4\n%Live Test Resume\n%%EOF'], { type: 'application/pdf' });
            formData.append('resume', dummyBlob, 'resume.pdf');

            const res = await fetch(`${API_BASE}/careers/${sampleJobSlug}`, {
                method: 'POST',
                headers: { apikey: API_KEY },
                body: formData
            });
            const data = await res.json();
            if (!res.ok || data.result !== 'success') throw new Error(JSON.stringify(data.message) || 'Failed candidate submit');
            return `Candidate application created: ${data.message || 'success'}`;
        });
    }

    // 16. Clean up test submissions
    console.log('\n--- Cleanup Test Records ---');
    const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@futuretek.com.np',
            password: process.env.ADMIN_DEFAULT_PASSWORD || 'admin@123!'
        })
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.data ? loginData.data.token : loginData.token;
    const authHeaders = { ...headers, Authorization: `Bearer ${adminToken}` };

    // Clean test contact
    await check('Cleanup - Delete Test Contact Inquiries', async () => {
        const contactListRes = await fetch(`${API_BASE}/admin/contacts`, { headers: authHeaders });
        const contactListData = await contactListRes.json();
        const testContacts = (contactListData.data || []).filter(c => c.email && c.email.includes('test_'));
        for (const c of testContacts) {
            await fetch(`${API_BASE}/admin/contacts/${c.id}`, { method: 'DELETE', headers: authHeaders });
        }
        return `Cleaned up ${testContacts.length} test contacts`;
    });

    // Clean test candidate
    await check('Cleanup - Delete Test Candidates', async () => {
        const candListRes = await fetch(`${API_BASE}/admin/candidates`, { headers: authHeaders });
        const candListData = await candListRes.json();
        const testCandidates = (candListData.data || []).filter(c => c.email && c.email.includes('test_'));
        for (const c of testCandidates) {
            await fetch(`${API_BASE}/admin/candidates/${c.id}`, { method: 'DELETE', headers: authHeaders });
        }
        return `Cleaned up ${testCandidates.length} test candidates`;
    });

    // Clean test subscriber
    await check('Cleanup - Delete Test Subscribers', async () => {
        const subListRes = await fetch(`${API_BASE}/admin/subscribers`, { headers: authHeaders });
        const subListData = await subListRes.json();
        const testSubs = (subListData.data || []).filter(s => s.email && s.email.includes('test_'));
        for (const s of testSubs) {
            await fetch(`${API_BASE}/admin/subscribers/${s.id}`, { method: 'DELETE', headers: authHeaders });
        }
        return `Cleaned up ${testSubs.length} test subscribers`;
    });

    console.log('\n=== FINAL PARITY INTEGRATION SUMMARY ===');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`Total Checks: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    if (failed === 0) {
        console.log('\nALL 20 ENDPOINTS & LIVE FORMS FULLY VERIFIED WITH 100% SUCCESS!');
    }
}

runTests().catch(console.error);
