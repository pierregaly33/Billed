/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent, within } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import { bills } from "../fixtures/bills.js";
import BillsUI from "../views/BillsUI.js";
import userEvent from "@testing-library/user-event";

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
            document.body.innerHTML = NewBillUI();

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
            document.body.innerHTML = NewBillUI();
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

describe("Given i am a user connected as an employee", () => {
    describe("when i post a newBill", () => {
        test("then add a bill from mock API POST", async () => {
            document.body.innerHTML = NewBillUI();
            const inputData = {
                type: "Transports",
                name: "Test",
                datepicker: "2025-07-29",
                amout: "100",
                vat: "10",
                pct: "19",
                commentary: "Test",
                file: new File(["image"], "image.png", { type: "image/png" }),
            };
            const formNewBill = screen.getByTestId("form-new-bill");
            const inputExpenseName = screen.getByTestId("expense-name");
            fireEvent.change(inputExpenseName, {
                target: { value: inputData.name },
            });
            expect(inputExpenseName.value).toBe(inputData.name);

            const inputExpenseType = screen.getByTestId("expense-type");
            fireEvent.change(inputExpenseType, {
                target: { value: inputData.type },
            });
            expect(inputExpenseType.value).toBe(inputData.type);

            const inputDatepicker = screen.getByTestId("datepicker");
            fireEvent.change(inputDatepicker, {
                target: { value: inputData.datepicker },
            });
            expect(inputDatepicker.value).toBe(inputData.datepicker);

            const inputAmount = screen.getByTestId("amount");
            fireEvent.change(inputAmount, {
                target: { value: inputData.amout },
            });
            expect(inputAmount.value).toBe(inputData.amout);

            const inputVAT = screen.getByTestId("vat");
            fireEvent.change(inputVAT, {
                target: { value: inputData.vat },
            });
            expect(inputVAT.value).toBe(inputData.vat);

            const inputPCT = screen.getByTestId("pct");
            fireEvent.change(inputPCT, {
                target: { value: inputData.pct },
            });
            expect(inputPCT.value).toBe(inputData.pct);

            const inputCommentary = screen.getByTestId("commentary");
            fireEvent.change(inputCommentary, {
                target: { value: inputData.commentary },
            });
            expect(inputCommentary.value).toBe(inputData.commentary);

            const inputFile = screen.getByTestId("file");
            userEvent.upload(inputFile, inputData.file);
            expect(inputData.file).toStrictEqual(inputData.file);

            const newBill = new NewBill({
                document,
                onNavigate,
                localStorage: window.localStorage,
            });

            const handleSubmit = jest.fn(newBill.handleSubmit);
            formNewBill.addEventListener("submit", handleSubmit);
            fireEvent.submit(formNewBill);
            expect(handleSubmit).toHaveBeenCalled();
        });
        describe("when an error occurs on API", () => {
            beforeEach(() => {
                jest.spyOn(mockStore, "bills");
                Object.defineProperty(window, "localStorage", { value: localStorageMock });
                window.localStorage.setItem(
                    "user",
                    JSON.stringify({
                        type: "Employee",
                        email: "a@a",
                    })
                );
                const root = document.createElement("div");
                root.setAttribute("id", "root");
                document.body.appendChild(root);
                router();
            });
            test("Add bills from an API and fails with 404 message error", async () => {
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error("Erreur 404"));
                        },
                    };
                });
                window.onNavigate(ROUTES_PATH.Bills);
                await new Promise(process.nextTick);
                const message = await screen.getByText(/Erreur 404/);
                expect(message).toBeTruthy();
            });
            test("Add bills from an API and fails with 500 message error", async () => {
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error("Erreur 500"));
                        },
                    };
                });
                window.onNavigate(ROUTES_PATH.Bills);
                await new Promise(process.nextTick);
                const message = await screen.getByText(/Erreur 500/);
                expect(message).toBeTruthy();
            });
        });
    });
});
