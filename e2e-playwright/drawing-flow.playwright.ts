import { test, expect, type Page } from "@playwright/test"

const TEST_PASSWORD = "password123"

function uniqueEmail(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function signUpAndOpenWorkspace(
  page: Page,
  email: string,
  password: string = TEST_PASSWORD
) {
  await page.goto("/signin")
  await expect(page.getByText("Don't have an account?")).toBeVisible({
    timeout: 15000
  })
  await page
    .locator("div", { hasText: "Don't have an account?" })
    .getByText("Sign up")
    .click()

  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole("button", { name: /^sign up$/i }).click()

  await page.waitForURL((url) => !url.pathname.startsWith("/signin"), {
    timeout: 30000
  })
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30000 })
  const expandSidebarButton = page.getByRole("button", {
    name: "Expand sidebar"
  })
  if (await expandSidebarButton.isVisible().catch(() => false)) {
    await expandSidebarButton.click()
  }
}

async function openPrimaryDrawingOptions(page: Page) {
  await ensureDrawingListed(page)
  const optionsButton = page
    .getByRole("button", { name: "Drawing options" })
    .first()
  await expect(optionsButton).toBeAttached({ timeout: 15000 })
  await optionsButton.click({ force: true })
}

async function ensureDrawingListed(page: Page) {
  const optionsButtons = page.getByRole("button", { name: "Drawing options" })
  if ((await optionsButtons.count()) > 0) return

  const canvas = page.locator("canvas").first()
  const box = await canvas.boundingBox()
  if (!box) {
    throw new Error("Canvas not available to create a persisted drawing")
  }

  const startX = box.x + Math.max(20, box.width * 0.2)
  const startY = box.y + Math.max(20, box.height * 0.2)
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 120, startY + 60)
  await page.mouse.up()

  // Wait for autosave and sidebar query refresh.
  await page.waitForTimeout(3500)
  await expect(optionsButtons.first()).toBeAttached({ timeout: 15000 })
}

test.describe.configure({ mode: "serial" })

test.describe("Drawing Flow", () => {
  test("should create a new drawing", async ({ page }) => {
    await signUpAndOpenWorkspace(page, uniqueEmail("e2e_draw_create"))
    await expect(page.locator("canvas").first()).toBeVisible()
  })

  test("should save drawing changes", async ({ page }) => {
    await signUpAndOpenWorkspace(page, uniqueEmail("e2e_draw_save"))

    const nameInput = page.getByLabel("Drawing name")
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill("E2E Save Test")
    await nameInput.press("Enter")
    await expect(nameInput).toHaveValue("E2E Save Test")
  })

  test("should display drawing name", async ({ page }) => {
    await signUpAndOpenWorkspace(page, uniqueEmail("e2e_draw_name"))
    await expect(page.getByLabel("Drawing name")).toBeVisible({
      timeout: 10000
    })
  })
})

test.describe("Collaboration", () => {
  test("should show an error when sharing with an unknown collaborator", async ({
    page
  }) => {
    const ownerEmail = uniqueEmail("e2e_owner")
    const unknownCollaboratorEmail = uniqueEmail("e2e_unknown")
    await signUpAndOpenWorkspace(page, ownerEmail)
    await openPrimaryDrawingOptions(page)
    await page.getByRole("menuitem", { name: "Share" }).click()

    const emailInput = page.getByPlaceholder("username")
    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await emailInput.fill(unknownCollaboratorEmail)
    await page.getByRole("button", { name: /add collaborator/i }).click()

    await expect(
      page.getByText(/no user with that email was found/i)
    ).toBeVisible({
      timeout: 15000
    })
  })
})

test.describe("Folder Organization", () => {
  test("should create and organize folders", async ({ page }) => {
    await signUpAndOpenWorkspace(page, uniqueEmail("e2e_folder"))

    await page
      .getByRole("button", { name: /new folder/i })
      .first()
      .click()

    const folderName = `Folder ${Date.now()}`
    const folderInput = page.getByPlaceholder("Folder name").first()
    await expect(folderInput).toBeVisible({ timeout: 10000 })
    await folderInput.fill(folderName)
    await folderInput.press("Enter")

    const folderNameInput = page.locator(`input[value="${folderName}"]`).first()
    await expect(folderNameInput).toBeVisible({
      timeout: 10000
    })

    await openPrimaryDrawingOptions(page)
    await page.getByRole("menuitem", { name: "Move to folder" }).hover()
    await page.getByRole("menuitem", { name: folderName }).first().click()

    await expect(folderNameInput).toBeVisible({
      timeout: 10000
    })
  })
})
