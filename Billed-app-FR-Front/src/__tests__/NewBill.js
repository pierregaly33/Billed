/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import { bills } from "../fixtures/bills.js";
import BillsUI from "../views/BillsUI.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
    beforeEach(() => {
        window.alert = jest.fn();
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem(
            "user",
            JSON.stringify({
                type: "Employee",
            })
        );
    });

    describe("When I am on NewBill Page", () => {
        test("Then the icon mail should be highlighted", async () => {
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.append(root);
            router();

            window.onNavigate(ROUTES_PATH.NewBill);

            await waitFor(() => screen.getByTestId("icon-mail"));
            const mailIcon = screen.getByTestId("icon-mail");
            expect(mailIcon.classList.contains("active-icon")).toBe(true);
        });
    });
    describe("When i choose an image with correct format", () => {
        test("Then the file name should be display", () => {
            const html = NewBillUI();
            document.body.innerHTML = html;

            new NewBill({ document, onNavigate: null, store: mockStore, localStorage });
            const file = screen.getByTestId("file");
            fireEvent.change(file, {
                target: {
                    files: [
                        new File(["image.png"], "image.png", {
                            type: "image/png",
                        }),
                    ],
                },
            });

            expect(file.files[0].name).toBe("image.png");
        });
        test("then a new bill was created", () => {
            const html = NewBillUI();
            document.body.innerHTML = html;
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname });
            };

            const newBill = new NewBill({ document, onNavigate, store: null, localStorage });
            const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
            const submit = screen.getByTestId("form-new-bill");
            submit.addEventListener("submit", handleSubmit);
            fireEvent.submit(submit);
            expect(handleSubmit).toHaveBeenCalled();
        });
    });
    describe("when i choose an image with uncorrect format", () => {
        test("Then the file name should not display and a alert shoud be display", () => {
            const html = NewBillUI();
            document.body.innerHTML = html;
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname });
            };
            const newBill = new NewBill({ document, onNavigate, store: null, localStorage });
            const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
            const file = screen.getByTestId("file");
            file.addEventListener("change", handleChangeFile);

            fireEvent.change(file, {
                target: {
                    files: [
                        new File(["image.pdf"], "image.pdf", {
                            type: "image.pdf",
                        }),
                    ],
                },
            });

            expect(alert).toHaveBeenCalled();
            expect(handleChangeFile).toHaveBeenCalled();
            expect(newBill.fileName).toBe(null);
        });
    });
});
