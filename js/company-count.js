function countUniqueCompanies(companies) {
    const seenIds = new Set();
    const seenNames = new Set();
    let count = 0;

    companies.forEach(company => {
        if (
            !company ||
            typeof company.id !== 'string' ||
            !company.id.trim() ||
            typeof company.name !== 'string' ||
            !company.name.trim() ||
            !Array.isArray(company.roles) ||
            !Array.isArray(company.techStack) ||
            !Array.isArray(company.indiaLocations)
        ) {
            return;
        }

        const id = company.id.trim().toLowerCase();
        const name = company.name.trim().toLowerCase().replace(/\s+/g, ' ');
        if (seenIds.has(id) || seenNames.has(name)) return;

        seenIds.add(id);
        seenNames.add(name);
        count += 1;
    });

    return count;
}

const uniqueCompanyCount = countUniqueCompanies(COMPANIES);

document.getElementById('companyCountHeadline').textContent = `${uniqueCompanyCount}+ Companies`;
document.getElementById('pageDescription').content =
    `Discover ${uniqueCompanyCount}+ IT companies hiring tech talent across India. Python, Cloud, DevOps, App Dev roles from FAANG to freshers.`;

document.querySelectorAll('[data-company-count]').forEach(element => {
    element.dataset.target = uniqueCompanyCount;
});

document.querySelectorAll('[data-company-count-copy]').forEach(element => {
    element.textContent = `${uniqueCompanyCount}+`;
});
