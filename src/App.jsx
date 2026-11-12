import { Navigate, Route, Routes } from 'react-router-dom';
import DemoShell from './components/DemoShell.jsx';
import Splash from './components/Splash.jsx';
import AppLayout from './components/AppLayout.jsx';
import { AppStoreProvider } from './store/AppStore.jsx';
import Home from './pages/Home.jsx';
import Seats from './pages/Seats.jsx';
import Rooms from './pages/Rooms.jsx';
import CheckIn from './pages/CheckIn.jsx';
import CheckOut from './pages/CheckOut.jsx';
import Plan from './pages/Plan.jsx';
import PlanNew from './pages/PlanNew.jsx';
import PlanSelect from './pages/PlanSelect.jsx';
import PlanGoals from './pages/PlanGoals.jsx';
import QuickPlan from './pages/QuickPlan.jsx';
import Pass from './pages/Pass.jsx';
import PassBuy from './pages/PassBuy.jsx';
import PassDone from './pages/PassDone.jsx';
import Record from './pages/Record.jsx';
import MonthSummary from './pages/MonthSummary.jsx';
import Types from './pages/Types.jsx';
import TypeDetail from './pages/TypeDetail.jsx';
import RecordDetail from './pages/RecordDetail.jsx';
import My from './pages/My.jsx';
import Focus from './pages/Focus.jsx';
import FocusDone from './pages/FocusDone.jsx';
import Onboarding from './pages/Onboarding.jsx';
import KioskHomeCompare from './pages/KioskHomeCompare.jsx';

export default function App() {
  return (
    <AppStoreProvider>
      <DemoShell>
        <Splash />
        <Routes>
          <Route path="compare/kiosk-home" element={<KioskHomeCompare />} />
          <Route element={<AppLayout withNav />}>
            <Route index element={<Home />} />
            <Route path="plan" element={<Plan />} />
            <Route path="pass" element={<Pass />} />
            <Route path="record" element={<Record />} />
            <Route path="my" element={<My />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route path="seats" element={<Seats />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="record/:date" element={<RecordDetail />} />
            <Route path="record/month/:month" element={<MonthSummary />} />
            <Route path="types" element={<Types />} />
            <Route path="types/:typeId" element={<TypeDetail />} />
            <Route path="focus/done" element={<FocusDone />} />
          </Route>
          <Route element={<AppLayout fullscreen />}>
            <Route path="pass/buy" element={<PassBuy />} />
            <Route path="pass/done" element={<PassDone />} />
            <Route path="plan/new" element={<PlanNew />} />
            <Route path="plan/:planId/edit" element={<PlanNew />} />
            <Route path="focus/plan" element={<PlanSelect />} />
            <Route path="focus/plan/:planId/goals" element={<PlanGoals />} />
            <Route path="focus/quick" element={<QuickPlan />} />
          </Route>
          <Route element={<AppLayout fullscreen dark />}>
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="check-in" element={<CheckIn />} />
            <Route path="check-out" element={<CheckOut />} />
            <Route path="focus" element={<Focus />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DemoShell>
    </AppStoreProvider>
  );
}
