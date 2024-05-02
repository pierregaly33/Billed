/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", async () => {
            Object.defineProperty(window, "localStorage", { value: localStorageMock });
            window.localStorage.setItem(
                "user",
                JSON.stringify({
                    type: "Employee",
                })
            );
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.append(root);
            router();
            window.onNavigate(ROUTES_PATH.Bills);
            await waitFor(() => screen.getByTestId("icon-window"));
            const windowIcon = screen.getByTestId("icon-window");
            //to-do write expect expression
            expect(windowIcon.classList.contains("active-icon")).toBe(true);
        });
        test("Then bills should be ordered from earliest to latest", () => {
            document.body.innerHTML = BillsUI({ data: bills });
            const dates = screen
                .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
                .map((a) => a.innerHTML);
            const antiChrono = (a, b) => (a < b ? 1 : -1);
            const datesSorted = [...dates].sort(antiChrono);
            expect(dates).toEqual(datesSorted);
        });
    });
    describe("When i am on Bills page and i click on new bill", () => {
        test("then it should open new bill page", () => {
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.append(root);
            router();
            window.onNavigate(ROUTES_PATH.Bills);

            const bills = new Bills({ document, onNavigate, store: null, localStorage: {} });

            //const newBill = jest.fn(() => bills.handleClickNewBill);
            const navigationButton = screen.getByTestId("btn-new-bill");
            // navigationButton.addEventListener("click", bills.handleClickNewBill);
            fireEvent.click(navigationButton);
            expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
        });
    });
    describe("When i am on bills page and i click on eye icon", () => {
        test("Then the should be display", () => {
            const html = BillsUI({
                data: bills,
            });
            document.body.innerHTML = html;
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname });
            };
            const billslist = new Bills({ document, onNavigate, store: null, localStorage: {} });

            $.fn.modal = jest.fn();

            const iconEye = screen.getAllByTestId("icon-eye")[0];

            const handleClickIconEye = jest.fn(() => billslist.handleClickIconEye(iconEye));

            iconEye.addEventListener("click", handleClickIconEye);

            fireEvent.click(iconEye);

            expect(handleClickIconEye).toHaveBeenCalled();

            const modale = document.getElementById("modaleFile");

            expect(modale).toBeTruthy();
        });
    });
});

describe("Given i am a user connected as employee", () => {
    describe("when i navigate to Bills page", () => {
        test("fetches bills from mock API GET", async () => {
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
            const pathname = ROUTES_PATH["Bills"];
            root.innerHTML = ROUTES({ pathname: pathname, loading: true });
            const bills = new Bills({ document, onNavigate, store: mockStore, localStorage });
            bills.getBills().then((data) => {
                root.innerHTML = BillsUI({ data });
                expect(document.querySelector("tbody").rows.length).toBeGreaterThan(0);
            });
        });
        describe("When an error occurs on API", () => {
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
            test("fetches bills from an API and fails with 404 message error", async () => {
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

            test("fetches messages from an API and fails with 500 message error", async () => {
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
